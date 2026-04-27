import { Server as Engine } from 'engine.io';
import { Server } from 'socket.io';
import type { NitroApp } from 'nitropack';

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();
  const io = new Server();

  io.bind(engine);

  io.on('connection', (socket) => {
    socket.on('create-room', (roomId: string) => {
      socket.join(roomId);
      io.to(roomId).emit('room-created', roomId);
    });

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      io.to(roomId).emit('player-joined', socket.id);
    });

    socket.on('submit-guess', (roomId: string, guess: { lat: number, lng: number }) => {
      io.to(roomId).emit('guess-submitted', { playerId: socket.id, guess });
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