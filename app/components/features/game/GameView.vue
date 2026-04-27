<template>
  <div class="game-container">
    <div class="gameplay-background">
      <!-- Only show map when playing -->
      <template v-if="geoStore.status === 'playing'">
        <div v-show="isLoading" class="panorama-view loading-view">
          <Icon name="svg-spinners:ring-resize" class="spinner" />
          <p class="loading-text">{{ t("game.ui.loading") }}...</p>
        </div>
        <div ref="panoramaElement" class="panorama-container"></div>
      </template>
      <div v-else class="animated-bg"></div>
    </div>

    <div class="hud-overlay">
      <header class="game-header">
        <div class="logo">
          <Icon name="ph:globe-hemisphere-east-duotone" class="logo-icon" />
          <h1>{{ t("game.title") }}</h1>
        </div>
        <div class="status-badge" v-if="geoStore.status !== 'menu'">
            <span class="pulse-dot"></span>
            {{ geoStore.status }}
        </div>
      </header>

      <Transition name="fade-slide">
        <GameMenu v-if="geoStore.status === 'menu'" 
                  v-model:selectedMap="selectedMap" 
                  v-model:selectedMode="selectedMode" 
                  @create="createLobby" 
                  @join="joinLobby" />
      </Transition>

      <Transition name="fade-slide">
        <LazyGameLobby v-if="geoStore.status === 'lobby'" 
                   @start="startGame" />
      </Transition>

      <Transition name="slide-up">
        <LazyGamePlay v-if="geoStore.status === 'playing'" />
      </Transition>

      <Transition name="fade">
        <LazyGameRoundResult v-if="geoStore.status === 'roundResult'" />
      </Transition>

      <Transition name="fade">
        <LazyGameFinished v-if="geoStore.status === 'finished'" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineAsyncComponent } from 'vue';
import { useGeoStore } from '~/stores/geoGame';
import { useI18n } from 'vue-i18n';
import GameMenu from '~/components/features/game/GameMenu.vue';
import 'mapillary-js/dist/mapillary.css';

const LazyGameLobby = defineAsyncComponent(() => import('~/components/features/game/GameLobby.vue'));
const LazyGamePlay = defineAsyncComponent(() => import('~/components/features/game/GamePlay.vue'));
const LazyGameRoundResult = defineAsyncComponent(() => import('~/components/features/game/GameRoundResult.vue'));
const LazyGameFinished = defineAsyncComponent(() => import('~/components/features/game/GameFinished.vue'));
const LazyGameRoundResult = defineAsyncComponent(() => import('~/components/features/game/GameRoundResult.vue'));

const { t } = useI18n();
const geoStore = useGeoStore();

const selectedMap = ref<string>("world");
const selectedMode = ref<string>("timeLimit");
const isLoading = ref<boolean>(true);

// Street View
const panoramaElement = ref<HTMLElement | null>(null);
let panoramaInstance: any = null;

const createLobby = (username: string): void => {
  geoStore.createRoom(username);
};

const joinLobby = (roomId: string, username: string): void => {
  if (roomId && username) {
    geoStore.joinRoom(roomId, username);
  }
};

const startGame = (): void => {
  geoStore.startGame();
};

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (geoStore.status === 'playing' || geoStore.status === 'lobby') {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
};

const initializePanorama = async () => {
  const config = useRuntimeConfig();

  if (import.meta.client && panoramaElement.value) {
    const { Viewer } = await import('mapillary-js');
    isLoading.value = true;

    // Reset previous viewer to fix WebGL/Mesh crashes between rounds
    if (panoramaInstance) {
      try { panoramaInstance.remove(); } catch (e) {}
      panoramaInstance = null;
      panoramaElement.value.innerHTML = '';
    }

    const baseLocations = [
      { lat: 47.4988776, lng: 19.0435422 }, // Budapest
      { lat: 48.8584, lng: 2.2945 },        // Paris
      { lat: 40.6892, lng: -74.0445 },      // NY
      { lat: 35.6895, lng: 139.6917 },      // Tokyo
      { lat: -33.8568, lng: 151.2153 },     // Sydney
      { lat: 51.5072, lng: -0.1276 },       // London
      { lat: 41.9028, lng: 12.4964 },       // Rome
      { lat: -22.9068, lng: -43.1729 },     // Rio de Janeiro
      { lat: 1.3521, lng: 103.8198 },       // Singapore
      { lat: 25.2048, lng: 55.2708 },       // Dubai
      { lat: 34.0522, lng: -118.2437 },     // Los Angeles
      { lat: -34.6037, lng: -58.3816 },     // Buenos Aires
    ];

    let imageId = "290680328905333"; // Biztos jó végső fallback (NY)
    let foundValidId = false;
    let actualPosition = null;

    // Keresünk egy RANDOM panorámát max 5 próbálkozásból
    for (let attempts = 0; attempts < 5 && !foundValidId; attempts++) {
      try {
        const base = baseLocations[Math.floor(Math.random() * baseLocations.length)]!;
        // Adjunk hozzá random távolságot (kb +/- 15km)
        const latOffset = (Math.random() - 0.5) * 0.3;
        const lngOffset = (Math.random() - 0.5) * 0.3;
        const position = { lat: base.lat + latOffset, lng: base.lng + lngOffset };

        const buffer = 0.005; // 0.01x0.01 terület
        const bbox = `${position.lng - buffer},${position.lat - buffer},${position.lng + buffer},${position.lat + buffer}`;
        // is_pano=true KÖTELEZŐ, különben bugos telefonos képeket kapunk (sima síkfotó, ami szétesik gömbként / Incorrect mesh)
        const url = `https://graph.mapillary.com/images?fields=id,geometry&is_pano=true&bbox=${bbox}&limit=50&access_token=${config.public.mapillaryClientToken}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
          const randomNearImage = data.data[Math.floor(Math.random() * data.data.length)];
          imageId = randomNearImage.id.toString();
          actualPosition = {
              lat: randomNearImage.geometry.coordinates[1],
              lng: randomNearImage.geometry.coordinates[0]
          };
          foundValidId = true;
        }
      } catch (e) {
        console.error("Mapillary fetch attempt failed", e);
      }
    }

    if (actualPosition) {
        geoStore.setActualLocation(actualPosition.lat, actualPosition.lng);
    } else {
        // Drop back to fallback location if API failed 5x times
        geoStore.setActualLocation(40.6892, -74.0445);
    }

    panoramaInstance = new Viewer({
      accessToken: config.public.mapillaryClientToken as string,
      container: panoramaElement.value,
      imageId: imageId.toString(),
      component: { cover: false }
    });

    panoramaInstance.on('load', () => {
      isLoading.value = false;
    });

    setTimeout(() => { isLoading.value = false; }, 4000);
  }
};

watch(() => geoStore.status, async (newStatus) => {
  if (newStatus === 'playing') {
    await nextTick();
    initializePanorama();
  }
});

onMounted(() => {
  geoStore.initSocket();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (panoramaInstance) {
    // If Mapillary Viewer has a remove/dispose method, we can call it.
    panoramaInstance.remove?.();
  }
});
</script>

<style scoped lang="scss">
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

.gameplay-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  .animated-bg {
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, #0f172a, #1e293b, #0f172a);
    background-size: 200% 200%;
    animation: gradientMove 15s ease infinite;
  }
  
  .panorama-container {
    width: 100%;
    height: 100%;
    animation: fadeIn 1s ease-in;
  }

  .loading-view {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    color: #e2e8f0;
    z-index: 2;

    .spinner {
      font-size: 4rem;
      color: #38bdf8;
      filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6));
    }
    .loading-text {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      animation: pulseText 1.5s infinite;
    }
  }
}

.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.game-header {
  padding: 1.5rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 100%);
  
  .logo {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    h1 {
      margin: 0;
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: 1px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
      background: linear-gradient(to right, #fff, #94a3b8);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .logo-icon {
      font-size: 2.5rem;
      color: #38bdf8;
      filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.5));
    }
  }

  .status-badge {
    background: rgba(0, 0, 0, 0.5);
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    backdrop-filter: blur(4px);

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
      animation: pulseDot 2s infinite;
    }
  }
}

/* Animations */
@keyframes pulseDot {
  0% { opacity: 0.5; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.5; transform: scale(0.8); }
}

@keyframes pulseText {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Vue Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

@media (max-width: 768px) {
  .game-header {
    padding: 1rem 1.5rem;
  }
}
</style>