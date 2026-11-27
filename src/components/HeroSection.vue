<script setup lang="ts">
import { computed } from 'vue'
import { DRAFT, affiliations, authorMarks, authorNotes, authors, links, t } from '../content'
import HeroReel from './HeroReel.vue'
import FactsRow from './FactsRow.vue'
import UiIcon from './UiIcon.vue'
import pku from '../assets/logos/pku.svg'
import alibaba from '../assets/logos/alibaba.svg'

const logos: Record<number, string> = { 1: pku, 2: alibaba }
const buttons = computed<{ key: string; icon: 'paper' | 'code' | 'weights'; label: string; url: string; primary: boolean }[]>(() => [
  { key: 'paper', icon: 'paper' as const, label: t.hero.paper, url: links.paper, primary: true },
  { key: 'code', icon: 'code' as const, label: t.hero.code, url: links.code, primary: false },
  { key: 'weights', icon: 'weights' as const, label: t.hero.weights, url: links.weights, primary: false },
// weights: no release decided yet, so no placeholder either
].filter((b) => b.url || (DRAFT && b.key !== 'weights')))
</script>

<template>
  <section id="top" class="hero">
    <div class="wrap">
      <div class="head">
        <h1 class="title">Spark<span class="wm">WM</span></h1>
        <p class="lead">{{ t.hero.lead }}</p>
        <div class="meta">
          <div class="who">
            <p v-if="authors.length" class="authors">
              <span v-for="(a, i) in authors" :key="a.name" class="author">
                <a v-if="a.url" :href="a.url">{{ a.name }}</a><template v-else>{{ a.name }}</template><sup>{{ authorMarks(a) }}</sup><template v-if="i < authors.length - 1">, </template>
              </span>
            </p>
            <p v-else-if="DRAFT" class="authors"><span class="pending">{{ t.credits.authorsPending }}</span></p>
            <ul class="affs">
              <li v-for="a in affiliations" :key="a.id">
                <sup v-if="authors.length" class="num aff-n">{{ a.id }}</sup>
                <img :src="logos[a.id]" :alt="a.name" :class="'logo logo-' + a.id" />
                <span v-if="a.id !== 2">{{ a.name }}</span>
              </li>
            </ul>
            <p v-if="authors.length" class="notes"><span v-for="(n, i) in authorNotes" :key="i">{{ n }}</span></p>
          </div>
          <div class="buttons">
            <template v-for="b in buttons" :key="b.key">
              <a v-if="b.url" class="btn pill" :class="{ primary: b.primary }" :href="b.url" target="_blank" rel="noopener"><UiIcon :name="b.icon" :size="16" />{{ b.label }}</a>
              <span v-else class="btn pill" aria-disabled="true"><UiIcon :name="b.icon" :size="16" />{{ b.label }}<span class="soon">{{ t.hero.soon }}</span></span>
            </template>
          </div>
        </div>
      </div>

      <HeroReel />
      <p class="base">{{ t.hero.base }}</p>
      <FactsRow />
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: clamp(28px, 4.4vw, 56px) 0 clamp(64px, 8vw, 112px);
}
.head {
  display: grid;
  gap: clamp(18px, 2vw, 26px);
  margin-bottom: clamp(28px, 3vw, 40px);
}
.title .wm {
  color: var(--brand-amber);
}
.title {
  font-size: clamp(64px, 10.4vw, 152px);
  line-height: 0.86;
  font-stretch: 116%;
  font-weight: 750;
  letter-spacing: -0.045em;
  margin-left: -0.04em;
}
.lead {
  max-width: 900px;
  font-size: clamp(20px, 1.9vw, 27px);
  line-height: 1.42;
  font-weight: 500;
  letter-spacing: -0.005em;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px 40px;
  flex-wrap: wrap;
  padding-top: 6px;
}
.base {
  max-width: 900px;
  margin: calc(-1 * clamp(8px, 1.6vw, 24px)) 0 clamp(32px, 4vw, 48px);
  color: var(--ink2);
  font-size: 17px;
  line-height: 1.65;
}
.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.pill {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 15px;
}
.pill[aria-disabled='true'] {
  border-style: solid;
  color: var(--ink2);
}
.soon {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink3);
}
.who {
  display: grid;
  gap: 10px;
}
.authors {
  font-size: 15px;
  color: var(--ink2);
  max-width: 640px;
}
.affs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 28px;
  align-items: center;
}
.affs li {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink2);
}
.logo {
  height: 30px;
  width: auto;
}
.logo-1 {
  filter: grayscale(1) contrast(1.5) brightness(0.8);
}
.logo-2 {
  height: 15px;
  filter: brightness(0);
  opacity: 0.72;
}
.logo-1 {
  height: 28px;
}
:root[data-theme='dark'] .logo-1 {
  filter: grayscale(1) contrast(1.5) brightness(0.8) invert(1);
}
:root[data-theme='dark'] .logo-2 {
  filter: brightness(0) invert(1);
  opacity: 0.72;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .logo-1 {
    filter: grayscale(1) contrast(1.5) brightness(0.8) invert(1);
  }
  :root:not([data-theme='light']) .logo-2 {
    filter: brightness(0) invert(1);
    opacity: 0.72;
  }
}
.aff-n {
  font-size: 12px;
  color: var(--ink3);
  margin-right: -4px;
}
.notes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  font-size: 13px;
  color: var(--ink3);
}
@media (max-width: 760px) {
  .base {
    font-size: 16px;
  }
}
@media (max-width: 400px) {
  .title {
    font-size: 16.5vw;
  }
}
</style>
