import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  roomId: string | null;
  players: Player[];
  status: 'menu' | 'lobby' | 'playing' | 'finished';
  currentRound: number;
  maxRounds: number;
}

export const useGeoStore = defineStore('geoGame', {
  state: () => ({
    roomId: null as string | null,
    players: [] as Player[],
    status: 'menu' as 'menu' | 'lobby' | 'playing' | 'roundResult' | 'finished',
    currentRound: 1,
    maxRounds: 5,
    socket: null as Socket | null,
    roundResultData: null as { distance: number, points: number, correctLocation: {lat: number, lng: number} } | null,
  }),

  actions: {
    initSocket() {
      if (!this.socket) {
        this.socket = io({ path: '/socket.io/' });

        this.socket.on('room-created', (roomId: string) => {
           this.status = 'lobby';
           this.roomId = roomId;
           this.players = [{ id: this.socket!.id!, name: 'You (Creator)', score: 0 }];
        });
        
        this.socket.on('player-joined', (playerId: string) => {
          if (playerId === this.socket!.id) {
             this.status = 'lobby';
             this.players = [{ id: playerId, name: 'You', score: 0 }];
          } else {
             this.players.push({ id: playerId, name: `Player ${playerId.substring(0, 4)}`, score: 0 });
          }
        });

        this.socket.on('guess-submitted', (data: { playerId: string, guess: { lat: number, lng: number } }) => {
          // Handle guess logic, updating score
        });
      }
    },
    
    createRoom() {
      if (!this.socket) this.initSocket();
      const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.socket?.emit('create-room', newLobbyId);
    },

    joinRoom(roomId: string) {
      if (!this.socket) this.initSocket();
      this.socket?.emit('join-room', roomId.toUpperCase());
    },

    startGame() {
      this.status = 'playing';
      this.roundResultData = null;
      // In a real app this goes through the socket to sync everyone
    },

    submitGuess(lat: number, lng: number) {
      if (this.roomId && this.socket) {
        this.socket.emit('submit-guess', this.roomId, { lat, lng });
      }
      
      // Temporary simulated round result
      this.status = 'roundResult';
      this.roundResultData = {
        distance: Math.floor(Math.random() * 5000), // temp
        points: Math.floor(Math.random() * 5000),
        correctLocation: { lat: 48.8584, lng: 2.2945 } // temp mock actual location
      };
    },
    
    nextRound() {
      if (this.currentRound < this.maxRounds) {
        this.currentRound++;
        this.status = 'playing';
        this.roundResultData = null;
      } else {
        this.status = 'finished';
      }
    }
  }
});