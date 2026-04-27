import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { NitroApp } from 'nitropack';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

const rooms = new Map<string, Player[]>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  io.on('connection', (socket) => {
    socket.on('create-room', (roomId: string, username: string) => {
      socket.join(roomId);
      rooms.set(roomId, [{ id: socket.id, name: username || 'Host', score: 0, isHost: true }]);
      io.to(roomId).emit('room-state', rooms.get(roomId));
    });

    socket.on('join-room', (roomId: string, username: string) => {
      socket.join(roomId);
      const roomPlayers = rooms.get(roomId) || [];
      roomPlayers.push({ id: socket.id, name: username || `Player ${socket.id.substring(0, 4)}`, score: 0, isHost: false });
      rooms.set(roomId, roomPlayers);
      io.to(roomId).emit('room-state', roomPlayers);
    });

    socket.on('start-game', (roomId: string) => {
      io.to(roomId).emit('game-started');
    });

    socket.on('submit-guess', (roomId: string, guess: { lat: number, lng: number }) => {
      io.to(roomId).emit('guess-submitted', { playerId: socket.id, guess });
    });

    socket.on('disconnect', () => {
      // Opcionális: távolítsuk el a játékost a szobákból
      for (const [roomId, players] of rooms.entries()) {
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          players.splice(index, 1);
          if (players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room-state', players);
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