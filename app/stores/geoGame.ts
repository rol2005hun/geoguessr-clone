import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost?: boolean;
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
    roundResultData: null as {
      distance: number;
      points: number;
      correctLocation: { lat: number; lng: number };
      guessedLocation?: { lat: number; lng: number };
    } | null,
    actualLocationForRound: null as { lat: number; lng: number; imageId?: string } | null,
    totalScore: 0,
    countdownTimer: null as number | null,
    hasGuessed: false,
    skipVotes: 0,
    hasVotedSkip: false,
    showLeaderboard: false
  }),

  actions: {
    initSocket() {
      if (!this.socket) {
        this.socket = io({ path: '/socket.io/' });

        this.socket.on('room-state', (players: Player[]) => {
          this.players = players;
          const me = players.find((p) => p.id === this.socket?.id);
          if (me) {
            this.isHost = !!me.isHost;
          }
        });

        this.socket.on('game-started', (isNewGame: boolean = false) => {
          if (isNewGame) {
            this.currentRound = 1;
            this.totalScore = 0;
            this.showLeaderboard = false;
          }
          this.countdownTimer = null;
          this.hasGuessed = false;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
          this.roundResultData = null;
          this.actualLocationForRound = null;
          this.status = 'playing';
        });

        this.socket.on('panorama-sync', (data: { lat: number; lng: number; imageId: string }) => {
          this.actualLocationForRound = data;
          this.countdownTimer = null;
          this.hasGuessed = false;
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
          this.status = 'lobby';
          this.hasGuessed = false;
          this.skipVotes = 0;
          this.hasVotedSkip = false;
        });

        this.socket.on('round-finished', (playersData: Player[]) => {
          this.status = 'roundResult';
          this.skipVotes = 0;
          this.hasVotedSkip = false;
          const me = playersData.find((p) => p.id === this.socket?.id);
          if (me) {
            this.totalScore = me.score;
          }
        });

        this.socket.on('skip-vote-updated', (votes: number) => {
          this.skipVotes = votes;
        });

        this.socket.on('skip-approved', () => {
          if (this.status === 'roundResult' && this.isHost) {
            this.nextRound();
          }
        });
      }
    },

    createRoom(username: string) {
      if (!this.socket) this.initSocket();
      this.userName = username;
      const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.roomId = newLobbyId;
      this.status = 'lobby';
      this.socket?.emit('create-room', newLobbyId, username);
    },

    joinRoom(roomId: string, username: string) {
      if (!this.socket) this.initSocket();
      this.userName = username;
      this.roomId = roomId.toUpperCase();
      this.status = 'lobby';
      this.socket?.emit('join-room', this.roomId, username);
    },

    startGame() {
      if (this.isHost && this.roomId && this.socket) {
        this.socket.emit('start-game', this.roomId, true);
      }
    },

    submitGuess(lat: number, lng: number) {
      const toRad = (value: number) => (value * Math.PI) / 180;
      if (!this.actualLocationForRound) return;

      const actualLat = this.actualLocationForRound.lat;
      const actualLng = this.actualLocationForRound.lng;
      const R = 6371;
      const dLat = toRad(lat - actualLat);
      const dLng = toRad(lng - actualLng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(actualLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
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
    },

    nextRound() {
      if (!this.isHost || !this.roomId || !this.socket) return;
      if (this.currentRound < this.maxRounds) {
        this.socket.emit('start-game', this.roomId, false);
        this.currentRound++;
      } else {
        this.socket.emit('end-game', this.roomId);
      }
    },

    voteSkip() {
      if (!this.hasVotedSkip && this.roomId && this.socket) {
        this.hasVotedSkip = true;
        this.socket.emit('vote-skip', this.roomId);
      }
    }
  }
});
