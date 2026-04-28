<template>
  <Html lang="hu">
    <Head>
      <Title>Geoguesser</Title>
    </Head>
  </Html>
  <div id="game-root">
    <NuxtRouteAnnouncer />
    <GameView />
  </div>
</template>

<script setup lang="ts">
import GameView from '~/components/features/game/GameView.vue';
</script>

<style lang="scss">
body, html, #__nuxt {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

#game-root {
  width: 100%;
  height: 100%;
}
</style>
