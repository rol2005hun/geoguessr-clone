import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    timerSoundEnabled: true,
    markerSoundEnabled: true
  }),
  actions: {
    initSettings(): void {
      if (import.meta.client) {
        const savedTimer = localStorage.getItem('ranzagg_sound_timer');
        if (savedTimer !== null) {
          this.timerSoundEnabled = savedTimer === '1';
        }

        const savedMarker = localStorage.getItem('ranzagg_sound_marker');
        if (savedMarker !== null) {
          this.markerSoundEnabled = savedMarker === '1';
        }
      }
    },
    toggleTimerSound(): void {
      this.timerSoundEnabled = !this.timerSoundEnabled;
      if (import.meta.client) {
        localStorage.setItem('ranzagg_sound_timer', this.timerSoundEnabled ? '1' : '0');
      }
    },
    toggleMarkerSound(): void {
      this.markerSoundEnabled = !this.markerSoundEnabled;
      if (import.meta.client) {
        localStorage.setItem('ranzagg_sound_marker', this.markerSoundEnabled ? '1' : '0');
      }
    }
  }
});
