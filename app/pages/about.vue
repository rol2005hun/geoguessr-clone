<template>
  <div class="page-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="page-panel">
      <NuxtLink to="/" class="back-btn">
        <Icon name="ph:arrow-left-bold" />
        {{ t('pages.backToMenu') }}
      </NuxtLink>

      <div class="page-header">
        <h2>{{ t('pages.about.title') }}</h2>
        <p class="subtitle">{{ t('pages.about.subtitle') }}</p>
      </div>

      <div class="about-section">
        <h3 class="section-title">
          <Icon name="ph:question-duotone" />
          {{ t('pages.about.whatTitle') }}
        </h3>
        <p class="section-desc">{{ t('pages.about.whatDesc') }}</p>
      </div>

      <div class="about-section">
        <h3 class="section-title">
          <Icon name="ph:star-duotone" />
          {{ t('pages.about.featuresTitle') }}
        </h3>
        <ul class="feature-list">
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature1') }}</li>
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature2') }}</li>
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature3') }}</li>
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature4') }}</li>
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature5') }}</li>
          <li><Icon name="ph:check-circle-duotone" class="feature-icon" /> {{ t('pages.about.feature6') }}</li>
        </ul>
      </div>

      <div class="about-section">
        <h3 class="section-title">
          <Icon name="ph:code-duotone" />
          {{ t('pages.about.techTitle') }}
        </h3>
        <p class="section-desc">{{ t('pages.about.techDesc') }}</p>
      </div>

      <div class="about-section">
        <h3 class="section-title">
          <Icon name="ph:heart-duotone" />
          {{ t('pages.about.creditsTitle') }}
        </h3>
        <ul class="credits-list">
          <li>{{ t('pages.about.credit1') }}</li>
          <li>{{ t('pages.about.credit2') }}</li>
          <li>{{ t('pages.about.credit3') }}</li>
          <li>{{ t('pages.about.credit4') }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

useHead({
  title: () => t('pages.about.pageTitle')
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
  max-width: 700px;
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

.about-section {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
  }
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
  margin: 0 0 1rem;
  border-left: 3px solid #4ade80;
  padding-left: 1rem;
}

.section-desc {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0;
  padding-left: 1rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .feature-icon {
    color: #4ade80;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
}

.credits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  li {
    color: #94a3b8;
    font-size: 0.9rem;
    line-height: 1.5;
    padding-left: 1rem;
    border-left: 2px solid rgba(59, 130, 246, 0.3);
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 2rem;
  }
}
</style>
