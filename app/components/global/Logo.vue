<template>
  <div class="brand-logo">
    <Icon name="ph:globe-hemisphere-east-duotone" class="logo-icon" />
    <h1>{{ $t('game.title') }}</h1>
  </div>
</template>

<style scoped lang="scss">
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .logo-icon {
    font-size: 2.2rem;
    color: #4ade80;
  }

  h1 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 1px;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

@media (max-width: 1000px) {
  .brand-logo {
    display: none;
  }
}
</style>
