import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { NitroApp } from 'nitropack';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasGuessed?: boolean;
  lastGuess?: { lat: number, lng: number };
}

interface RoomState {
  players: Player[];
  panoramaData?: { lat: number, lng: number, imageId: string };
  roundStatus: 'waiting' | 'countdown' | 'finished';
  countdownTimer?: number;
}

const rooms = new Map<string, RoomState>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  io.on('connection', (socket) => {
    socket.on('create-room', (roomId: string, username: string) => {
      socket.join(roomId);
      rooms.set(roomId, {
        players: [{ id: socket.id, name: username || 'Host', score: 0, isHost: true }],
        roundStatus: 'waiting'
      });
      io.to(roomId).emit('room-state', rooms.get(roomId)?.players);
    });

    socket.on('join-room', (roomId: string, username: string) => {
      socket.join(roomId);
      const room = rooms.get(roomId);
      const roomPlayers = room ? room.players : [];
      roomPlayers.push({ id: socket.id, name: username || `Player ${socket.id.substring(0, 4)}`, score: 0, isHost: false });
      if (room) room.players = roomPlayers;
      else rooms.set(roomId, { players: roomPlayers, roundStatus: 'waiting' });
      
      io.to(roomId).emit('room-state', roomPlayers);
    });

    socket.on('start-game', (roomId: string) => {
      const room = rooms.get(roomId);
      if (room) {
        room.roundStatus = 'waiting';
        room.players.forEach(p => { p.hasGuessed = false; p.lastGuess = undefined; });
      }
      io.to(roomId).emit('game-started');
    });

    socket.on('set-panorama', (roomId: string, panoramaData: { lat: number, lng: number, imageId: string }) => {
       const room = rooms.get(roomId);
       if (room) {
         room.panoramaData = panoramaData;
         io.to(roomId).emit('panorama-sync', panoramaData);
       }
    });

    socket.on('submit-guess', (roomId: string, guess: { lat: number, lng: number, distance: number, points: number }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
         player.hasGuessed = true;
         player.lastGuess = guess;
         player.score += guess.points;
      }
      
      io.to(roomId).emit('player-guessed', { playerId: socket.id, guess: { ...guess, lat: 0, lng: 0 } }); // Ne küldjük el a koordinátát amíg nincs vége
      io.to(roomId).emit('room-state', room.players);

      if (room.roundStatus === 'waiting') {
        if (room.players.every(p => p.hasGuessed)) {
            room.roundStatus = 'finished';
            io.to(roomId).emit('round-finished', room.players);
            return;
        }

        room.roundStatus = 'countdown';
        let timeLeft = 15;
        io.to(roomId).emit('countdown-started', timeLeft);
        
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(timer);
            if (room.roundStatus === 'countdown') {
               room.roundStatus = 'finished';
               io.to(roomId).emit('round-finished', room.players);
            }
          } else {
             // Maybe everyone guessed?
             if (room.players.every(p => p.hasGuessed)) {
                clearInterval(timer);
                if (room.roundStatus === 'countdown') {
                   room.roundStatus = 'finished';
                   io.to(roomId).emit('round-finished', room.players);
                }
             } else {
                io.to(roomId).emit('countdown-tick', timeLeft);
             }
          }
        }, 1000);
      } else if (room.roundStatus === 'countdown') {
         if (room.players.every(p => p.hasGuessed)) {
            // Timer checks every second, but we can fast-track here too
            room.roundStatus = 'finished';
            io.to(roomId).emit('round-finished', room.players);
         }
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        const index = room.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room-state', room.players);
          }
          break;
        }
      }
    });
  });

  nitroApp.router.use('/socket.io/', defineEventHandler({
    handler(event) {
      engine.handleRequest(event.node.req, event.node.res);
      event._handled = true;
    },
    websocket: {
      open(peer) {
        // Safe access for different Nuxt Nitro / crossws versions
        const req = (peer as any)?.ctx?.node?.req || (peer as any)?._internal?.req || (peer as any)?.req;
        const ws = (peer as any)?.ctx?.node?.ws || (peer as any)?._internal?.ws || (peer as any)?.websocket;

        if (req && ws) {
          (engine as any).prepare(req);
          (engine as any).onWebSocket(req, req.socket, ws);
        }
      }
    }
  }));
});