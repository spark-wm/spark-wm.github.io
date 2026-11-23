<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { DRAFT, t } from './content'
import { tr } from './state'
import TopNav from './components/TopNav.vue'
import HeroSection from './components/HeroSection.vue'
import DemoSection from './components/DemoSection.vue'
import MethodSection from './components/MethodSection.vue'
import ResultsSection from './components/ResultsSection.vue'
import TrainingSection from './components/TrainingSection.vue'
import RolloutSection from './components/RolloutSection.vue'
import CreditsSection from './components/CreditsSection.vue'

const banner = computed(() => tr(t.draftBanner))
watchEffect(() => { document.title = 'SparkWM' })
</script>

<template>
  <div v-if="DRAFT" class="draft-banner" role="note">{{ banner }}</div>
  <TopNav />
  <main>
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
.draft-banner {
  padding: 8px 16px;
  background: var(--ink);
  color: var(--bg);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
}
</style>
