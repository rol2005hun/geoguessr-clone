import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { NitroApp } from 'nitropack';
import { sendDiscordLog } from '../utils/discord';

interface Player {
  id: string;
  sessionId: string;
  name: string;
  score: number;
  isHost: boolean;
  hasGuessed?: boolean;
  lastGuess?: { lat: number; lng: number; distance: number; points: number };
  connected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

interface RoomState {
  players: Player[];
  locations: Array<{ lat: number; lng: number; imageId: string }>;
  maxRounds: number;
  currentRound: number;
  roundStatus: 'waiting' | 'countdown' | 'finished';
  countdownTimer?: ReturnType<typeof setInterval>;
  currentCountdown?: number;
  skipVotes?: Set<string>;
  usedImageIds: Set<string>;
  panoramaReady: boolean;
  status: 'lobby' | 'playing' | 'roundResult' | 'finished';
}

interface CrossWSPeer {
  ctx?: { node?: { req?: unknown; ws?: unknown } };
  _internal?: { req?: unknown; ws?: unknown };
  req?: unknown;
  websocket?: unknown;
}

interface EngineServer {
  prepare(req: unknown): void;
  onWebSocket(req: unknown, socket: unknown, ws: unknown): void;
}

interface GameOptions {
  continents?: string[];
  countries?: string[];
  cities?: string[];
  count?: number;
}

const rooms = new Map<string, RoomState>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server({
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.bind(engine);

  io.on('connection', (socket) => {
    socket.on(
      'create-room',
      (roomId: string, username: string, sessionId: string, options?: { maxRounds?: number }) => {
        socket.join(roomId);
        const room: RoomState = {
          players: [
            {
              id: socket.id,
              sessionId: sessionId || socket.id,
              name: username || 'Host',
              score: 0,
              isHost: true,
              connected: true
            }
          ],
          locations: [],
          maxRounds: options?.maxRounds || 5,
          currentRound: 1,
          roundStatus: 'waiting',
          usedImageIds: new Set<string>(),
          panoramaReady: false,
          status: 'lobby'
        };
        rooms.set(roomId, room);

        void sendDiscordLog(`Player **${username}** created room **${roomId}**`, 'INFO');

        socket.emit('reconnect-state', {
          status: room.status,
          currentRound: room.currentRound,
          maxRounds: room.maxRounds
        });

        setTimeout(() => {
          io.to(roomId).emit(
            'room-state',
            room.players.filter((p) => p.connected)
          );
        }, 100);
      }
    );

    socket.on('join-room', (roomId: string, username: string, sessionId: string) => {
      socket.join(roomId);
      let room = rooms.get(roomId);

      if (!room) {
        room = {
          players: [],
          locations: [],
          maxRounds: 5,
          currentRound: 1,
          roundStatus: 'waiting',
          usedImageIds: new Set<string>(),
          panoramaReady: false,
          status: 'lobby'
        };
        rooms.set(roomId, room);
      }

      let player = room.players.find((p) => p.sessionId === sessionId);

      if (player) {
        if (player.disconnectTimer) {
          clearTimeout(player.disconnectTimer);
          player.disconnectTimer = undefined;
        }
        player.id = socket.id;
        player.connected = true;
        if (username) {
          player.name = username;
        }
        void sendDiscordLog(`Player **${username}** reconnected to room **${roomId}**`, 'INFO');
      } else {
        player = {
          id: socket.id,
          sessionId: sessionId || socket.id,
          name: username || `Player ${socket.id.substring(0, 4)}`,
          score: 0,
          isHost: room.players.length === 0,
          connected: true
        };
        room.players.push(player);
        void sendDiscordLog(`Player **${username}** joined room **${roomId}**`, 'INFO');
      }

      socket.emit('reconnect-state', {
        status: room.status,
        currentRound: room.currentRound,
        maxRounds: room.maxRounds,
        panoramaData: room.locations[room.currentRound - 1],
        countdownLeft: room.currentCountdown
      });

      setTimeout(() => {
        io.to(roomId).emit(
          'room-state',
          room.players.filter((p) => p.connected)
        );
      }, 100);
    });

    socket.on(
      'start-game',
      async (roomId: string, isNewGame: boolean = false, options?: GameOptions) => {
        const room = rooms.get(roomId);
        if (!room) return;

        if (isNewGame) {
          room.status = 'playing';
          room.currentRound = 1;
          room.maxRounds = options?.count || 5;
          room.roundStatus = 'waiting';
          room.panoramaReady = false;
          room.locations = [];

          try {
            const data = await $fetch<
              Array<{ location: { coordinates: [number, number] }; imageId: string }>
            >('/api/game/batch-locations', {
              query: {
                count: room.maxRounds,
                continents: options?.continents,
                countries: options?.countries,
                cities: options?.cities
              }
            });

            if (data && data.length > 0) {
              room.locations = data.map((loc) => ({
                lat: Number(loc.location.coordinates[1]),
                lng: Number(loc.location.coordinates[0]),
                imageId: String(loc.imageId)
              }));
              room.panoramaReady = true;
            }
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            void sendDiscordLog(`Batch fetch failed for **${roomId}**: ${errorMessage}`, 'ERROR');
          }

          room.players.forEach((p) => {
            p.score = 0;
            p.hasGuessed = false;
            p.lastGuess = undefined;
          });
        } else {
          room.currentRound++;
          room.status = 'playing';
          room.roundStatus = 'waiting';
          room.players.forEach((p) => {
            p.hasGuessed = false;
            p.lastGuess = undefined;
          });
        }

        const currentLoc = room.locations[room.currentRound - 1];

        io.to(roomId).emit('game-started', isNewGame, room.currentRound, room.maxRounds);

        if (currentLoc) {
          io.to(roomId).emit('panorama-sync', currentLoc);
        }
      }
    );

    socket.on(
      'submit-guess',
      (roomId: string, guess: { lat: number; lng: number; distance: number; points: number }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.find((p) => p.id === socket.id);
        if (player && !player.hasGuessed) {
          player.hasGuessed = true;
          player.lastGuess = guess;
          player.score += guess.points;

          io.to(roomId).emit('player-guessed', {
            playerId: socket.id,
            guess: { ...guess, lat: 0, lng: 0 }
          });
          io.to(roomId).emit(
            'room-state',
            room.players.filter((p) => p.connected)
          );

          const activePlayers = room.players.filter((p) => p.connected);

          if (room.roundStatus === 'waiting') {
            if (activePlayers.every((p) => p.hasGuessed)) {
              room.status = 'roundResult';
              room.roundStatus = 'finished';
              room.skipVotes = new Set();
              io.to(roomId).emit('round-finished', activePlayers);
              return;
            }

            room.roundStatus = 'countdown';
            let timeLeft = 15;
            room.currentCountdown = timeLeft;
            io.to(roomId).emit('countdown-started', timeLeft);

            room.countdownTimer = setInterval(() => {
              timeLeft--;
              room.currentCountdown = timeLeft;

              const checkActive = room.players.filter((p) => p.connected);
              if (timeLeft <= 0 || checkActive.every((p) => p.hasGuessed)) {
                if (room.countdownTimer) clearInterval(room.countdownTimer);
                if (room.roundStatus === 'countdown') {
                  room.status = 'roundResult';
                  room.roundStatus = 'finished';
                  room.skipVotes = new Set();
                  io.to(roomId).emit('round-finished', checkActive);
                }
              } else {
                io.to(roomId).emit('countdown-tick', timeLeft);
              }
            }, 1000);
          } else if (room.roundStatus === 'countdown') {
            if (activePlayers.every((p) => p.hasGuessed)) {
              if (room.countdownTimer) clearInterval(room.countdownTimer);
              room.status = 'roundResult';
              room.roundStatus = 'finished';
              room.skipVotes = new Set();
              io.to(roomId).emit('round-finished', activePlayers);
            }
          }
        }
      }
    );

    socket.on('vote-skip', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room && room.roundStatus === 'finished') {
        if (!room.skipVotes) room.skipVotes = new Set();
        room.skipVotes.add(socket.id);
        const activeCount = room.players.filter((p) => p.connected).length;
        io.to(roomId).emit('skip-vote-updated', room.skipVotes.size, activeCount);
        if (room.skipVotes.size >= activeCount) {
          io.to(roomId).emit('skip-approved');
        }
      }
    });

    socket.on('end-game', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room) {
        room.status = 'finished';
        room.roundStatus = 'waiting';
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        io.to(roomId).emit('game-ended-leaderboard');
        io.to(roomId).emit(
          'room-state',
          room.players.filter((p) => p.connected)
        );
      }
    });

    socket.on('return-to-lobby', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room) {
        room.status = 'lobby';
        room.roundStatus = 'waiting';
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        room.players.forEach((p) => {
          p.score = 0;
          p.hasGuessed = false;
          p.lastGuess = undefined;
        });
        io.to(roomId).emit('returned-to-lobby');
        io.to(roomId).emit(
          'room-state',
          room.players.filter((p) => p.connected)
        );
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.connected = false;
          io.to(roomId).emit(
            'room-state',
            room.players.filter((p) => p.connected)
          );

          player.disconnectTimer = setTimeout(() => {
            const index = room.players.findIndex((p) => p.sessionId === player.sessionId);
            if (index !== -1) {
              room.players.splice(index, 1);
              if (room.players.length === 0) {
                if (room.countdownTimer) clearInterval(room.countdownTimer);
                rooms.delete(roomId);
              } else {
                if (player.isHost) {
                  const newHost = room.players.find((p) => p.connected);
                  if (newHost) newHost.isHost = true;
                }
                io.to(roomId).emit(
                  'room-state',
                  room.players.filter((p) => p.connected)
                );
              }
            }
          }, 15000);
          break;
        }
      }
    });
  });

  nitroApp.router.use(
    '/socket.io/',
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          const crossWSPeer = peer as unknown as CrossWSPeer;
          const req =
            crossWSPeer?.ctx?.node?.req || crossWSPeer?._internal?.req || crossWSPeer?.req;
          const ws =
            crossWSPeer?.ctx?.node?.ws || crossWSPeer?._internal?.ws || crossWSPeer?.websocket;

          if (req && ws) {
            const engineServer = engine as unknown as EngineServer;
            engineServer.prepare(req);
            engineServer.onWebSocket(req, (req as { socket?: unknown }).socket, ws);
          }
        }
      }
    })
  );
});
