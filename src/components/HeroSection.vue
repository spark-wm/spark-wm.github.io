<script setup lang="ts">
import { computed } from 'vue'
import { DRAFT, affiliations, authors, links, t } from '../content'
import { tr } from '../state'
import HeroReel from './HeroReel.vue'
import FactsRow from './FactsRow.vue'
import pku from '../assets/logos/pku.svg'
import alibaba from '../assets/logos/alibaba.svg'

const logos: Record<number, string> = { 1: pku, 2: alibaba }
const buttons = computed(() => [
  { key: 'paper', label: tr(t.hero.paper), url: links.paper, primary: true },
  { key: 'code', label: tr(t.hero.code), url: links.code, primary: false },
  { key: 'weights', label: tr(t.hero.weights), url: links.weights, primary: false },
// weights: no release decided yet, so no placeholder either
].filter((b) => b.url || (DRAFT && b.key !== 'weights')))
</script>

<template>
  <section id="top" class="hero">
    <div class="wrap">
      <div class="head">
        <h1 class="title">Spark<span class="wm">WM</span></h1>
        <div class="who">
          <p v-if="authors.length" class="authors">
            <span v-for="(a, i) in authors" :key="a.name" class="author">
              <a v-if="a.url" :href="a.url">{{ a.name }}</a><template v-else>{{ a.name }}</template><sup>{{ a.aff.join(',') }}</sup><template v-if="i < authors.length - 1">, </template>
            </span>
          </p>
          <p v-else-if="DRAFT" class="authors"><span class="pending">{{ tr(t.credits.authorsPending) }}</span></p>
          <ul class="affs">
            <li v-for="a in affiliations" :key="a.id">
              <img :src="logos[a.id]" :alt="tr(a.name)" :class="'logo logo-' + a.id" />
              <span v-if="a.id !== 2">{{ tr(a.name) }}</span>
            </li>
          </ul>
        </div>
        <div class="side">
          <p class="lead">{{ tr(t.hero.lead) }}</p>
          <p class="base">{{ tr(t.hero.base) }}</p>
        </div>
        <div class="buttons">
          <template v-for="b in buttons" :key="b.key">
            <a v-if="b.url" class="btn" :class="{ primary: b.primary }" :href="b.url" target="_blank" rel="noopener">{{ b.label }}</a>
            <span v-else class="btn" aria-disabled="true">{{ b.label }}<span class="soon">{{ tr(t.hero.soon) }}</span></span>
          </template>
        </div>
      </div>

      <HeroReel />
      <FactsRow />
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: clamp(28px, 5vw, 64px) 0 clamp(64px, 8vw, 112px);
}
.head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: clamp(20px, 2.4vw, 32px) 40px;
  margin-bottom: clamp(28px, 3.4vw, 44px);
}
.title .wm {
  color: var(--brand-amber);
}
.who {
  align-self: end;
  padding-bottom: 14px;
}
.title {
  font-size: clamp(64px, 10.4vw, 152px);
  line-height: 0.86;
  font-stretch: 116%;
  font-weight: 750;
  letter-spacing: -0.045em;
  margin-left: -0.04em;
}
.side {
  display: grid;
  gap: 12px;
  max-width: 860px;
}
.lead {
  font-size: clamp(20px, 2.1vw, 30px);
  line-height: 1.38;
  font-weight: 500;
  letter-spacing: -0.005em;
}
html:lang(zh-CN) .lead {
  line-height: 1.6;
  letter-spacing: 0;
}
.base {
  color: var(--ink2);
  font-size: 16px;
}
.buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-self: end;
  justify-content: flex-end;
}
.soon {
  font-weight: 500;
  color: var(--ink3);
}
.who {
  display: grid;
  gap: 10px;
  justify-items: end;
  text-align: right;
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
:root[data-theme='dark'] .logo-1 {
  filter: grayscale(1) contrast(1.5) brightness(0.8) invert(1);
}
:root[data-theme='dark'] .logo-2 {
  filter: brightness(0) invert(1);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .logo-1 {
    filter: grayscale(1) contrast(1.5) brightness(0.8) invert(1);
  }
  :root:not([data-theme='light']) .logo-2 {
    filter: brightness(0) invert(1);
  }
}
@media (max-width: 860px) {
  .head {
    grid-template-columns: 1fr;
  }
  .who {
    order: 4;
    padding-bottom: 0;
  }
  .buttons {
    justify-content: flex-start;
  }
  .who {
    justify-items: start;
    text-align: left;
  }
}
</style>
