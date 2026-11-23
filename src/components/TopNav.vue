<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { t } from '../content'
import { isDark, tr, ui } from '../state'
import BrandMark from './BrandMark.vue'
import UiIcon from './UiIcon.vue'

const scrolled = ref(false)
const active = ref('')
const sections = ['demos', 'method', 'results', 'training', 'citation'] as const
const label = (k: (typeof sections)[number]) => tr(t.nav[k])

let io: IntersectionObserver | null = null
const onScroll = () => { scrolled.value = window.scrollY > 8 }

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) active.value = e.target.id === 'top' ? '' : e.target.id
  }, { rootMargin: '-45% 0px -50% 0px' })
  for (const id of ['top', 'rollout', ...sections]) { const el = document.getElementById(id); if (el) io.observe(el) }
})
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); io?.disconnect() })

function toggleTheme() { ui.theme = isDark() ? 'light' : 'dark' }
function toggleLang() { ui.lang = ui.lang === 'en' ? 'zh' : 'en' }
function toggleSound() { ui.sound = !ui.sound }
</script>

<template>
  <header class="nav" :class="{ scrolled }">
    <div class="wrap row">
      <a href="#top" class="brand" aria-label="SparkWM">
        <BrandMark :size="28" wordmark />
      </a>
      <nav class="links" aria-label="Sections">
        <a v-for="s in sections" :key="s" :href="'#' + s" :class="{ on: active === s }">{{ label(s) }}</a>
      </nav>
      <div class="tools">
        <button class="tool sound" :class="{ on: ui.sound }" :aria-pressed="ui.sound" @click="toggleSound">
          <UiIcon :name="ui.sound ? 'sound-on' : 'sound-off'" />
          <span class="tool-text">{{ ui.sound ? tr(t.nav.soundOn) : tr(t.nav.soundOff) }}</span>
        </button>
        <button class="tool" :aria-label="tr(t.nav.theme)" :title="tr(t.nav.theme)" @click="toggleTheme"><UiIcon name="theme" /></button>
        <button class="tool lang" @click="toggleLang">{{ tr(t.nav.lang) }}</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}
.nav.scrolled {
  border-bottom-color: var(--line);
}
.row {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 64px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--ink);
}
.links {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.links a {
  padding: 8px 12px;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 500;
  color: var(--ink2);
  text-decoration: none;
  transition: color 0.15s;
}
.links a:hover,
.links a.on {
  color: var(--ink);
}
.links a.on {
  box-shadow: inset 0 -2px 0 var(--accent);
  border-radius: 0;
}
.tools {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tool {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  min-width: 40px;
  justify-content: center;
  padding: 0 10px;
  border-radius: var(--radius);
  color: var(--ink2);
  font-size: 15px;
  font-weight: 500;
}
.tool:hover {
  color: var(--ink);
  background: var(--bg2);
}
.tool.sound.on {
  color: var(--accent-ink);
}
.lang {
  font-weight: 600;
}
@media (max-width: 980px) {
  .links {
    display: none;
  }
  .tools {
    margin-left: auto;
  }
}
@media (max-width: 520px) {
  .tool-text {
    display: none;
  }
  .row {
    gap: 8px;
  }
}
</style>
