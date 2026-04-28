import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
}

export interface GameState {
  roomId: string | null;
  userName: string;
  isHost: boolean;
  players: Player[];
  status: 'menu' | 'lobby' | 'playing' | 'finished';
  currentRound: number;
  maxRounds: number;
}

export const useGeoStore = defineStore('geoGame', {
  state: () => ({
    roomId: null as string | null,
    userName: '',
    isHost: false,
    players: [] as Player[],
    status: 'menu' as 'menu' | 'lobby' | 'playing' | 'roundResult' | 'finished',
    currentRound: 1,
    maxRounds: 5,
    socket: null as Socket | null,
    roundResultData: null as { distance: number, points: number, correctLocation: {lat: number, lng: number}, guessedLocation?: {lat: number, lng: number} } | null,
    actualLocationForRound: null as { lat: number, lng: number, imageId?: string } | null,
    totalScore: 0,
    countdownTimer: null as number | null,
    hasGuessed: false,
  }),

  actions: {
    initSocket() {
      if (!this.socket) {
        this.socket = io({ path: '/socket.io/' });

        this.socket.on('room-state', (players: Player[]) => {
          this.status = 'lobby';
          this.players = players;
          
          const me = players.find(p => p.id === this.socket?.id);
          if (me) {
            this.isHost = !!me.isHost;
          }
        });

        this.socket.on('game-started', () => {
          this.countdownTimer = null;
          this.hasGuessed = false;
          this.status = 'playing';
          this.roundResultData = null;
          this.currentRound = 1;
          this.totalScore = 0;
        });

        this.socket.on('panorama-sync', (data: { lat: number, lng: number, imageId: string }) => {
          this.actualLocationForRound = data;
          this.countdownTimer = null;
          this.hasGuessed = false;
        });

        this.socket.on('countdown-started', (time: number) => {
          this.countdownTimer = time;
        });

        this.socket.on('countdown-tick', (time: number) => {
          this.countdownTimer = time;
        });

        this.socket.on('round-finished', (playersData: Player[]) => {
           this.status = 'roundResult';
           if (this.socket && this.actualLocationForRound && this.roundResultData) {
              const me = playersData.find(p => p.id === this.socket!.id);
              if (me && me.lastGuess) {
                 this.totalScore = me.score;
              }
           }
        });

        this.socket.on('player-guessed', (data: { playerId: string, guess: { lat: number, lng: number } }) => {
          // Handle guess logic, updating score
        });
      }
    },
    
    createRoom(username: string) {
      if (!this.socket) this.initSocket();
      this.userName = username;
      const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.roomId = newLobbyId;
      this.socket?.emit('create-room', newLobbyId, username);
    },

    joinRoom(roomId: string, username: string) {
      if (!this.socket) this.initSocket();
      this.userName = username;
      this.roomId = roomId.toUpperCase();
      this.socket?.emit('join-room', this.roomId, username);
    },

    startGame() {
      if (this.isHost && this.roomId && this.socket) {
        this.currentRound = 1;
        this.totalScore = 0;
        this.socket.emit('start-game', this.roomId);
      }
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

      this.hasGuessed = true;

      // Mentjük a lokális cache-be azonnal
      this.roundResultData = {
        distance: distanceKm, 
        points: pointsCalculated,
        correctLocation: { lat: actualLat, lng: actualLng },
        guessedLocation: { lat, lng }
      };

      if (this.roomId && this.socket) {
        this.socket.emit('submit-guess', this.roomId, { lat, lng, distance: distanceKm, points: pointsCalculated });
      }
    },
    
    nextRound() {
      if (this.currentRound < this.maxRounds) {
        if (this.roomId && this.socket && this.isHost) {
           this.socket.emit('start-game', this.roomId);
        }
        this.currentRound++;
        // The host triggers 'start-game' which will broadcast to all clients and flip them to playing
      } else {
        this.status = 'finished';
      }
    }
  }
});