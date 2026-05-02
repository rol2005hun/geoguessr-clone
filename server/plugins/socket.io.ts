import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { NitroApp } from 'nitropack';

interface Player {
  id: string;
  sessionId: string;
  name: string;
  score: number;
  isHost: boolean;
  hasGuessed?: boolean;
  lastGuess?: { lat: number; lng: number };
  connected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

interface RoomState {
  players: Player[];
  panoramaData?: { lat: number; lng: number; imageId: string };
  roundStatus: 'waiting' | 'countdown' | 'finished';
  countdownTimer?: ReturnType<typeof setInterval>;
  currentCountdown?: number;
  skipVotes?: Set<string>;
  usedImageIds: Set<string>;
  panoramaReady: boolean;
  status: 'lobby' | 'playing' | 'roundResult' | 'finished';
  currentRound: number;
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
  continent?: string;
  country?: string;
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
    socket.on('create-room', (roomId: string, username: string, sessionId: string) => {
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
        roundStatus: 'waiting',
        usedImageIds: new Set<string>(),
        panoramaReady: false,
        status: 'lobby',
        currentRound: 1
      };
      rooms.set(roomId, room);

      socket.emit('reconnect-state', {
        status: room.status,
        currentRound: room.currentRound
      });

      io.to(roomId).emit(
        'room-state',
        room.players.filter((p) => p.connected)
      );
    });

    socket.on('join-room', (roomId: string, username: string, sessionId: string) => {
      socket.join(roomId);
      let room = rooms.get(roomId);

      if (!room) {
        room = {
          players: [],
          roundStatus: 'waiting',
          usedImageIds: new Set<string>(),
          panoramaReady: false,
          status: 'lobby',
          currentRound: 1
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
      }

      socket.emit('reconnect-state', {
        status: room.status,
        currentRound: room.currentRound,
        panoramaData: room.panoramaData,
        countdownLeft: room.currentCountdown
      });

      io.to(roomId).emit(
        'room-state',
        room.players.filter((p) => p.connected)
      );
    });

    socket.on(
      'start-game',
      async (roomId: string, isNewGame: boolean = false, options?: GameOptions) => {
        const room = rooms.get(roomId);
        if (room) {
          room.status = 'playing';
          room.currentRound = isNewGame ? 1 : room.currentRound + 1;
          room.roundStatus = 'waiting';
          room.panoramaReady = false;

          try {
            const queryParams: Record<string, string> = {};
            if (options?.continent) queryParams.continent = options.continent;
            if (options?.country) queryParams.country = options.country;

            const panorama = await $fetch<{
              location: { coordinates: [number, number] };
              imageId: string;
            }>('/api/game/random-location', { query: queryParams });

            if (panorama) {
              room.panoramaData = {
                lat: panorama.location.coordinates[1],
                lng: panorama.location.coordinates[0],
                imageId: panorama.imageId
              };
              room.panoramaReady = true;
              room.usedImageIds.add(panorama.imageId);
            }
          } catch (e) {
            console.error('Failed to fetch from DB', e);
          }

          room.players.forEach((p) => {
            p.hasGuessed = false;
            p.lastGuess = undefined;
            if (isNewGame) p.score = 0;
          });

          io.to(roomId).emit('game-started', isNewGame, room.currentRound);

          if (room.panoramaData) {
            io.to(roomId).emit('panorama-sync', room.panoramaData);
          }
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

              if (timeLeft <= 0) {
                if (room.countdownTimer) clearInterval(room.countdownTimer);
                if (room.roundStatus === 'countdown') {
                  room.status = 'roundResult';
                  room.roundStatus = 'finished';
                  room.skipVotes = new Set();
                  io.to(roomId).emit(
                    'round-finished',
                    room.players.filter((p) => p.connected)
                  );
                }
              } else {
                if (room.players.filter((p) => p.connected).every((p) => p.hasGuessed)) {
                  if (room.countdownTimer) clearInterval(room.countdownTimer);
                  if (room.roundStatus === 'countdown') {
                    room.status = 'roundResult';
                    room.roundStatus = 'finished';
                    room.skipVotes = new Set();
                    io.to(roomId).emit(
                      'round-finished',
                      room.players.filter((p) => p.connected)
                    );
                  }
                } else {
                  io.to(roomId).emit('countdown-tick', timeLeft);
                }
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
        room.panoramaReady = false;
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        room.players.forEach((p) => {
          p.hasGuessed = false;
          p.lastGuess = undefined;
        });
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
        room.panoramaReady = false;
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
                if (player.isHost && room.players.length > 0) {
                  const newHost = room.players.find((p) => p.connected);
                  if (newHost) {
                    newHost.isHost = true;
                  }
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
