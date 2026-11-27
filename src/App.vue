<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { DRAFT, t } from './content'
import TopNav from './components/TopNav.vue'
import HeroSection from './components/HeroSection.vue'
import DemoSection from './components/DemoSection.vue'
import MethodSection from './components/MethodSection.vue'
import ResultsSection from './components/ResultsSection.vue'
import TrainingSection from './components/TrainingSection.vue'
import RolloutSection from './components/RolloutSection.vue'
import CreditsSection from './components/CreditsSection.vue'

const banner = computed(() => t.draftBanner)
watchEffect(() => { document.title = t.pageTitle })
</script>

<template>
  <a class="skip" href="#main">{{ t.nav.skip }}</a>
  <div v-if="DRAFT" class="draft-banner" role="note">{{ banner }}</div>
  <TopNav />
  <main id="main" tabindex="-1">
    <HeroSection />
    <DemoSection />
    <MethodSection />
    <ResultsSection />
    <TrainingSection />
    <RolloutSection />
    <CreditsSection />
  </main>
</template>

<style>
/* visually hidden until focused from the keyboard */
.skip:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.skip:focus {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 100;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--ink);
  color: var(--bg);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
main:focus {
  outline: none;
}
.draft-banner {
  padding: 8px 16px;
  background: var(--bg2);
  color: var(--ink2);
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
}
</style>
