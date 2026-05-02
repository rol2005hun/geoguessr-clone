import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
  hasGuessed?: boolean;
  lastGuess?: { lat: number; lng: number };
  sessionId?: string;
  connected?: boolean;
}

export interface GameOptions {
  continent?: string;
  country?: string;
}

export interface RoundResult {
  distance: number;
  points: number;
  correctLocation: { lat: number; lng: number };
  guessedLocation?: { lat: number; lng: number };
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
    roundResultData: null as RoundResult | null,
    actualLocationForRound: null as { lat: number; lng: number; imageId?: string } | null,
    totalScore: 0,
    countdownTimer: null as number | null,
    hasGuessed: false,
    skipVotes: 0,
    hasVotedSkip: false,
    showLeaderboard: false,
    lastError: null as string | null
  }),

  actions: {
    initSession(): string {
      let sId = sessionStorage.getItem('ranzagg_session_id');
      if (!sId) {
        sId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('ranzagg_session_id', sId);
      }
      return sId;
    },

    resetRoomState(): void {
      this.roomId = null;
      this.status = 'menu';
      this.players = [];
      this.isHost = false;
      this.currentRound = 1;
      this.totalScore = 0;
      this.roundResultData = null;
      this.actualLocationForRound = null;
      this.hasGuessed = false;
      this.countdownTimer = null;
      this.skipVotes = 0;
      this.hasVotedSkip = false;
      this.showLeaderboard = false;
      this.lastError = null;
    },

    initSocket(): void {
      if (this.socket) return;

      try {
        this.socket = io(window.location.origin, {
          path: '/socket.io/',
          transports: ['websocket'],
          secure: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        this.socket.on('connect_error', (err: Error) => {
          console.error('Socket connection error:', err);
          this.lastError = 'error.connectionFailed';
        });

        this.socket.on('connect', () => {
          try {
            const savedRoomId = sessionStorage.getItem('ranzagg_room_id');
            const savedUsername = sessionStorage.getItem('ranzagg_username');
            const sessionId = sessionStorage.getItem('ranzagg_session_id');

            if (savedRoomId && savedUsername && sessionId) {
              this.socket?.emit('join-room', savedRoomId, savedUsername, sessionId);
            }
          } catch (err: unknown) {
            console.error('Error during reconnect emission:', err);
          }
        });

        this.socket.on(
          'reconnect-state',
          (data: {
            status: 'lobby' | 'playing' | 'roundResult' | 'finished';
            currentRound: number;
            panoramaData?: { lat: number; lng: number; imageId?: string };
            countdownLeft?: number;
          }) => {
            try {
              if (data.status) this.status = data.status;
              if (data.currentRound) this.currentRound = data.currentRound;
              if (data.panoramaData) {
                this.actualLocationForRound = data.panoramaData;
              }
              if (data.countdownLeft !== undefined) {
                this.countdownTimer = data.countdownLeft;
              }
            } catch (err: unknown) {
              console.error('Error updating state on reconnect:', err);
            }
          }
        );

        this.socket.on('room-state', (players: Player[]) => {
          try {
            this.players = players;
            const me = players.find((p) => p.id === this.socket?.id);
            if (me) {
              this.isHost = !!me.isHost;
            }
          } catch (err: unknown) {
            console.error('Error handling room state:', err);
          }
        });

        this.socket.on('game-started', (isNewGame: boolean, roundNum: number) => {
          try {
            if (isNewGame) {
              this.currentRound = 1;
              this.totalScore = 0;
              this.showLeaderboard = false;
            } else if (roundNum) {
              this.currentRound = roundNum;
            }
            this.countdownTimer = null;
            this.hasGuessed = false;
            this.skipVotes = 0;
            this.hasVotedSkip = false;
            this.roundResultData = null;
            this.actualLocationForRound = null;
            this.status = 'playing';
          } catch (err: unknown) {
            console.error('Error starting game:', err);
          }
        });

        this.socket.on('panorama-sync', (data: { lat: number; lng: number; imageId: string }) => {
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

        this.socket.on('returned-to-lobby', () => {
          try {
            this.status = 'lobby';
            this.currentRound = 1;
            this.totalScore = 0;
            this.roundResultData = null;
            this.actualLocationForRound = null;
            this.hasGuessed = false;
            this.skipVotes = 0;
            this.hasVotedSkip = false;
          } catch (err: unknown) {
            console.error('Error returning to lobby:', err);
          }
        });

        this.socket.on('game-ended-leaderboard', () => {
          this.showLeaderboard = true;
          this.status = 'finished';
          this.hasGuessed = false;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
        });

        this.socket.on('round-finished', (playersData: Player[]) => {
          try {
            this.status = 'roundResult';
            this.countdownTimer = null;
            this.skipVotes = 0;
            this.hasVotedSkip = false;
            this.players = playersData;
            const me = playersData.find((p) => p.id === this.socket?.id);
            if (me) {
              this.totalScore = me.score;
            }
          } catch (err: unknown) {
            console.error('Error handling round finish:', err);
          }
        });

        this.socket.on('skip-vote-updated', (votes: number) => {
          this.skipVotes = votes;
        });

        this.socket.on('skip-approved', () => {
          try {
            if (this.status === 'roundResult' && this.isHost) {
              this.nextRound();
            }
          } catch (err: unknown) {
            console.error('Error handling skip approval:', err);
          }
        });
      } catch (err: unknown) {
        console.error('Failed to initialize socket:', err);
        this.lastError = 'error.connectionFailed';
      }
    },

    createRoom(username: string): void {
      try {
        if (!this.socket) this.initSocket();
        const sessionId = this.initSession();
        this.userName = username;
        const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.roomId = newLobbyId;
        sessionStorage.setItem('ranzagg_room_id', newLobbyId);
        sessionStorage.setItem('ranzagg_username', username);
        this.socket?.emit('create-room', newLobbyId, username, sessionId);
      } catch (err: unknown) {
        console.error('Failed to create room:', err);
        this.lastError = 'error.createLobby';
      }
    },

    joinRoom(roomId: string, username: string): void {
      try {
        if (!this.socket) this.initSocket();
        const sessionId = this.initSession();
        const cleanId = roomId.toUpperCase();
        this.userName = username;
        this.roomId = cleanId;
        sessionStorage.setItem('ranzagg_room_id', cleanId);
        sessionStorage.setItem('ranzagg_username', username);
        this.socket?.emit('join-room', cleanId, username, sessionId);
      } catch (err: unknown) {
        console.error('Failed to join room:', err);
        this.lastError = 'error.joinLobby';
      }
    },

    startGame(options?: GameOptions): void {
      try {
        if (this.isHost && this.roomId && this.socket) {
          this.socket.emit('start-game', this.roomId, true, options);
        }
      } catch (err: unknown) {
        console.error('Failed to start game:', err);
      }
    },

    submitGuess(lat: number, lng: number): void {
      try {
        const toRad = (value: number): number => (value * Math.PI) / 180;
        if (!this.actualLocationForRound) return;

        const actualLat = this.actualLocationForRound.lat;
        const actualLng = this.actualLocationForRound.lng;
        const R = 6371;
        const dLat = toRad(lat - actualLat);
        const dLng = toRad(lng - actualLng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(actualLat)) *
            Math.cos(toRad(lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        let pointsCalculated = Math.floor(5000 * Math.exp(-distanceKm / 2000));
        if (distanceKm > 10000) pointsCalculated = 0;
        if (distanceKm < 5) pointsCalculated = 5000;

        this.hasGuessed = true;
        this.roundResultData = {
          distance: distanceKm,
          points: pointsCalculated,
          correctLocation: { lat: actualLat, lng: actualLng },
          guessedLocation: { lat, lng }
        };

        if (this.roomId && this.socket) {
          this.socket.emit('submit-guess', this.roomId, {
            lat,
            lng,
            distance: distanceKm,
            points: pointsCalculated
          });
        }
      } catch (err: unknown) {
        console.error('Failed to submit guess:', err);
      }
    },

    nextRound(): void {
      try {
        if (!this.isHost || !this.roomId || !this.socket) return;
        if (this.currentRound < this.maxRounds) {
          this.socket.emit('start-game', this.roomId, false);
        } else {
          this.socket.emit('end-game', this.roomId);
        }
      } catch (err: unknown) {
        console.error('Failed to initiate next round:', err);
      }
    },

    voteSkip(): void {
      try {
        if (!this.hasVotedSkip && this.roomId && this.socket) {
          this.hasVotedSkip = true;
          this.socket.emit('vote-skip', this.roomId);
        }
      } catch (err: unknown) {
        console.error('Failed to register skip vote:', err);
      }
    },

    clearError(): void {
      this.lastError = null;
    }
  }
});
