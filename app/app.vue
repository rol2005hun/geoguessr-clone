<template>
  <div id="game-root">
    <NuxtRouteAnnouncer />

    <div class="global-logo-wrapper">
      <Logo />
    </div>

    <NuxtPage />
  </div>
</template>

<style lang="scss">
body,
html,
#__nuxt {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  background-color: #0f172a;
  color: #f8fafc;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

#game-root {
  width: 100%;
  height: 100%;
  position: relative;
}

.global-logo-wrapper {
  position: absolute;
  top: 1.5rem;
  left: 2.5rem;
  z-index: 9999;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .global-logo-wrapper {
    display: none;
  }
}
</style>
