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
    roundResultData: null as { distance: number, points: number, correctLocation: {lat: number, lng: number}, guessedLocation?: {lat: number, lng: number} } | null,
    actualLocationForRound: null as { lat: number, lng: number } | null,
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

    setActualLocation(lat: number, lng: number) {
      // Frissíti, hogy épp hol tartózkodunk (Mapillary fetch után)
      this.actualLocationForRound = { lat, lng };
    },

    submitGuess(lat: number, lng: number) {
      // Távolság-számítás a haversine formulával a tényleges hely és a tipp alapján
      const toRad = (value: number) => value * Math.PI / 180;
      let distanceKm = 0;
      let actualLat = 48.8584;
      let actualLng = 2.2945;

      if (this.actualLocationForRound) {
        actualLat = this.actualLocationForRound.lat;
        actualLng = this.actualLocationForRound.lng;
        
        const R = 6371; // Föld sugara km-ben
        const dLat = toRad(lat - actualLat);
        const dLng = toRad(lng - actualLng);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(actualLat)) * Math.cos(toRad(lat)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceKm = R * c;
      }

      // Pontszám logisztika
      // max 5000 pont, ha 20km-en belül vagy
      let pointsCalculated = Math.floor(5000 * Math.exp(-distanceKm / 2000));
      if (distanceKm > 10000) pointsCalculated = 0;
      if (distanceKm < 5) pointsCalculated = 5000;

      if (this.roomId && this.socket) {
        this.socket.emit('submit-guess', this.roomId, { lat, lng });
      }
      
      // Temporary simulated round result
      this.status = 'roundResult';
      // Mentsük el a tippet is, hogy a térképen meg tudjuk jeleníteni
      this.roundResultData = {
        distance: distanceKm, 
        points: pointsCalculated,
        correctLocation: { lat: actualLat, lng: actualLng },
        guessedLocation: { lat, lng }
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