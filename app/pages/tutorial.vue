<template>
  <div class="page-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="page-panel">
      <NuxtLink to="/" class="back-btn">
        <Icon name="ph:arrow-left-bold" />
        {{ t('pages.backToMenu') }}
      </NuxtLink>

      <div class="page-header">
        <h2>{{ t('pages.tutorial.title') }}</h2>
        <p class="subtitle">{{ t('pages.tutorial.subtitle') }}</p>
      </div>

      <div class="steps-grid">
        <div class="step-card">
          <div class="step-icon"><Icon name="ph:eye-duotone" /></div>
          <h3>{{ t('pages.tutorial.step1Title') }}</h3>
          <p>{{ t('pages.tutorial.step1Desc') }}</p>
        </div>
        <div class="step-card">
          <div class="step-icon"><Icon name="ph:magnifying-glass-duotone" /></div>
          <h3>{{ t('pages.tutorial.step2Title') }}</h3>
          <p>{{ t('pages.tutorial.step2Desc') }}</p>
        </div>
        <div class="step-card">
          <div class="step-icon"><Icon name="ph:map-pin-duotone" /></div>
          <h3>{{ t('pages.tutorial.step3Title') }}</h3>
          <p>{{ t('pages.tutorial.step3Desc') }}</p>
        </div>
        <div class="step-card">
          <div class="step-icon"><Icon name="ph:trophy-duotone" /></div>
          <h3>{{ t('pages.tutorial.step4Title') }}</h3>
          <p>{{ t('pages.tutorial.step4Desc') }}</p>
        </div>
        <div class="step-card">
          <div class="step-icon"><Icon name="ph:game-controller-duotone" /></div>
          <h3>{{ t('pages.tutorial.step5Title') }}</h3>
          <p>{{ t('pages.tutorial.step5Desc') }}</p>
        </div>
      </div>

      <div class="tips-section">
        <h3 class="section-title">
          <Icon name="ph:lightbulb-duotone" />
          {{ t('pages.tutorial.tipsTitle') }}
        </h3>
        <ul class="tips-list">
          <li><Icon name="ph:sun-duotone" class="tip-icon" /> {{ t('pages.tutorial.tip1') }}</li>
          <li><Icon name="ph:car-duotone" class="tip-icon" /> {{ t('pages.tutorial.tip2') }}</li>
          <li><Icon name="ph:road-horizon-duotone" class="tip-icon" /> {{ t('pages.tutorial.tip3') }}</li>
          <li><Icon name="ph:tree-duotone" class="tip-icon" /> {{ t('pages.tutorial.tip4') }}</li>
          <li><Icon name="ph:translate-duotone" class="tip-icon" /> {{ t('pages.tutorial.tip5') }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

useHead({
  title: () => t('pages.tutorial.pageTitle')
});
</script>

<style scoped lang="scss">
.page-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 5rem 1rem 2rem;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-background-logo {
  position: fixed;
  font-size: 80vh;
  color: rgba(74, 222, 128, 0.04);
  top: 50%;
  right: -10%;
  transform: translateY(-50%) rotate(-15deg);
  z-index: 0;
  pointer-events: none;
}

.page-panel {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 1;
  margin: auto 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  width: fit-content;

  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.page-header {
  text-align: center;

  h2 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #4ade80 0%, #3b82f6 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 0.5rem;
  }

  .subtitle {
    color: #94a3b8;
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
  }
}

.steps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2rem;
}

@media (min-width: 600px) {
  .steps-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.step-card {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.3);
  }

  .step-icon {
    font-size: 2rem;
    color: #4ade80;
    margin-bottom: 0.8rem;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem;
  }

  p {
    color: #94a3b8;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
  }
}

.tips-section {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 1.2rem;
  border-left: 3px solid #4ade80;
  padding-left: 1rem;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .tip-icon {
    color: #3b82f6;
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 2rem;
  }
}
</style>
