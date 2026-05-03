import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
  hasGuessed?: boolean;
  lastGuess?: { lat: number; lng: number; distance: number; points: number };
  sessionId?: string;
  connected?: boolean;
}

export interface GameOptions {
  continent?: string;
  country?: string;
  count?: number;
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
    selectedMap: 'world',
    selectedMode: 'timeLimit',
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
          transports: ['polling'],
          upgrade: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        });

        this.socket.on('connect_error', (err: Error) => {
          console.error('Socket connection error:', err);
          this.lastError = 'error.connectionFailed';
        });

        this.socket.on('connect', () => {
          const savedRoomId = sessionStorage.getItem('ranzagg_room_id');
          const savedUsername = sessionStorage.getItem('ranzagg_username');
          const sessionId = sessionStorage.getItem('ranzagg_session_id');

          if (savedRoomId && savedUsername && sessionId) {
            this.socket?.emit('join-room', savedRoomId, savedUsername, sessionId);
          }
        });

        this.socket.on(
          'reconnect-state',
          (data: {
            status: 'lobby' | 'playing' | 'roundResult' | 'finished';
            currentRound: number;
            maxRounds?: number;
            panoramaData?: { lat: number; lng: number; imageId?: string };
            countdownLeft?: number;
          }) => {
            try {
              const savedId = sessionStorage.getItem('ranzagg_room_id');
              if (savedId) this.roomId = savedId;

              if (data.status) this.status = data.status;
              if (data.currentRound) this.currentRound = data.currentRound;
              if (data.maxRounds && this.status !== 'menu') {
                this.maxRounds = data.maxRounds;
              }
              if (data.panoramaData) this.actualLocationForRound = data.panoramaData;
              if (data.countdownLeft !== undefined) this.countdownTimer = data.countdownLeft;
            } catch (err: unknown) {
              console.error('State update error:', err);
            }
          }
        );

        this.socket.on('room-state', (players: Player[]) => {
          this.players = players;
          const me = players.find((p) => p.id === this.socket?.id);
          if (me) this.isHost = !!me.isHost;
        });

        this.socket.on(
          'game-started',
          (isNewGame: boolean, roundNum: number, maxRounds: number) => {
            if (isNewGame) {
              this.currentRound = 1;
              this.totalScore = 0;
              this.showLeaderboard = false;
            } else if (roundNum) {
              this.currentRound = roundNum;
            }
            if (maxRounds) this.maxRounds = maxRounds;

            this.countdownTimer = null;
            this.hasGuessed = false;
            this.skipVotes = 0;
            this.hasVotedSkip = false;
            this.roundResultData = null;
            this.status = 'playing';
          }
        );

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
          this.status = 'lobby';
          this.currentRound = 1;
          this.totalScore = 0;
          this.roundResultData = null;
          this.actualLocationForRound = null;
          this.hasGuessed = false;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
        });

        this.socket.on('game-ended-leaderboard', () => {
          this.showLeaderboard = true;
          this.status = 'finished';
          this.hasGuessed = false;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
        });

        this.socket.on('round-finished', (playersData: Player[]) => {
          this.status = 'roundResult';
          this.countdownTimer = null;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
          this.players = playersData;
          const me = playersData.find((p) => p.id === this.socket?.id);
          if (me) this.totalScore = me.score;
        });

        this.socket.on('skip-vote-updated', (votes: number) => {
          this.skipVotes = votes;
        });

        this.socket.on('skip-approved', () => {
          if (this.status === 'roundResult' && this.isHost) {
            this.nextRound();
          }
        });
      } catch (err: unknown) {
        console.error('Socket init error:', err);
        this.lastError = 'error.connectionFailed';
      }
    },

    createRoom(username: string): void {
      if (!this.socket) this.initSocket();
      const sessionId = this.initSession();
      this.userName = username;
      const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      sessionStorage.setItem('ranzagg_room_id', newId);
      sessionStorage.setItem('ranzagg_username', username);
      this.socket?.emit('create-room', newId, username, sessionId, { maxRounds: this.maxRounds });
    },

    joinRoom(roomId: string, username: string): void {
      if (!this.socket) this.initSocket();
      const sessionId = this.initSession();
      const cleanId = roomId.toUpperCase();
      this.userName = username;
      sessionStorage.setItem('ranzagg_room_id', cleanId);
      sessionStorage.setItem('ranzagg_username', username);
      this.socket?.emit('join-room', cleanId, username, sessionId);
    },

    startGame(): void {
      if (this.isHost && this.roomId && this.socket) {
        const options: GameOptions = { count: this.maxRounds };
        if (this.selectedMap !== 'world') options.continent = this.selectedMap;
        this.socket.emit('start-game', this.roomId, true, options);
      }
    },

    submitGuess(lat: number, lng: number): void {
      if (!this.actualLocationForRound || !this.roomId || !this.socket) return;
      const toRad = (v: number): number => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat - this.actualLocationForRound.lat);
      const dLng = toRad(lng - this.actualLocationForRound.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(this.actualLocationForRound.lat)) *
          Math.cos(toRad(lat)) *
          Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      let pts = Math.floor(5000 * Math.exp(-dist / 2000));
      if (dist > 10000) pts = 0;
      if (dist < 5) pts = 5000;

      this.hasGuessed = true;
      this.roundResultData = {
        distance: dist,
        points: pts,
        correctLocation: {
          lat: this.actualLocationForRound.lat,
          lng: this.actualLocationForRound.lng
        },
        guessedLocation: { lat, lng }
      };

      this.socket.emit('submit-guess', this.roomId, { lat, lng, distance: dist, points: pts });
    },

    nextRound(): void {
      if (!this.isHost || !this.roomId || !this.socket) return;
      if (this.currentRound < this.maxRounds) {
        this.socket.emit('start-game', this.roomId, false);
      } else {
        this.socket.emit('end-game', this.roomId);
      }
    },

    voteSkip(): void {
      if (!this.hasVotedSkip && this.roomId && this.socket) {
        this.hasVotedSkip = true;
        this.socket.emit('vote-skip', this.roomId);
      }
    },

    clearError(): void {
      this.lastError = null;
    }
  }
});
