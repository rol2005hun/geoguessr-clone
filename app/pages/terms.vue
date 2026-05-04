<template>
  <div class="page-container">
    <Icon name="ph:globe-hemisphere-east-duotone" class="panel-background-logo" />

    <div class="page-panel">
      <NuxtLink to="/" class="back-btn">
        <Icon name="ph:arrow-left-bold" />
        {{ t('pages.backToMenu') }}
      </NuxtLink>

      <div class="page-header">
        <h2>{{ t('pages.terms.title') }}</h2>
        <p class="subtitle">{{ t('pages.terms.subtitle') }}</p>
        <span class="last-updated">{{ t('pages.terms.lastUpdated') }}</span>
      </div>

      <div class="terms-content">
        <div class="terms-section">
          <h3>{{ t('pages.terms.s1Title') }}</h3>
          <p>{{ t('pages.terms.s1Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s2Title') }}</h3>
          <p>{{ t('pages.terms.s2Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s3Title') }}</h3>
          <p>{{ t('pages.terms.s3Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s4Title') }}</h3>
          <p>{{ t('pages.terms.s4Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s5Title') }}</h3>
          <p>{{ t('pages.terms.s5Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s6Title') }}</h3>
          <p>{{ t('pages.terms.s6Desc') }}</p>
        </div>
        <div class="terms-section">
          <h3>{{ t('pages.terms.s7Title') }}</h3>
          <p>{{ t('pages.terms.s7Desc') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

useHead({
  title: () => t('pages.terms.pageTitle')
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
    margin: 0 0 0.8rem;
  }

  .last-updated {
    color: #64748b;
    font-size: 0.8rem;
    font-style: italic;
  }
}

.terms-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.terms-section {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.6rem;
    border-left: 3px solid #3b82f6;
    padding-left: 1rem;
  }

  p {
    color: #94a3b8;
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 0;
    padding-left: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header h2 {
    font-size: 2rem;
  }
}
</style>
