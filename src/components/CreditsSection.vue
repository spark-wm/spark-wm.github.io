<script setup lang="ts">
import { ref } from 'vue'
import { DRAFT, affiliations, authorMarks, authorNotes, authors, bibtex, relatedBibtex, t } from '../content'
import UiIcon from './UiIcon.vue'
import BrandMark from './BrandMark.vue'
import pku from '../assets/logos/pku.svg'
import alibaba from '../assets/logos/alibaba.svg'

const logos: Record<number, string> = { 1: pku, 2: alibaba }
/** Which BibTeX block was copied last, so that only its button reads "Copied". */
const copied = ref<'' | 'main' | 'related'>('')
async function copy(key: 'main' | 'related', text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = key
  setTimeout(() => { if (copied.value === key) copied.value = '' }, 1800)
}
const bibLines = bibtex.split('\n')
// one card per related entry; entries are separated by an empty line
const relatedEntries = relatedBibtex.split('\n\n')
</script>

<template>
  <section id="citation" class="block">
    <div class="wrap grid">
      <div class="team">
        <h2>{{ t.credits.title }}</h2>
        <p v-if="authors.length" class="authors">
          <span v-for="(a, i) in authors" :key="a.name">{{ a.name }}<sup>{{ authorMarks(a) }}</sup><template v-if="i < authors.length - 1">, </template></span>
        </p>
        <p v-else-if="DRAFT"><span class="pending">{{ t.credits.authorsPending }}</span></p>
        <ul class="affs">
          <li v-for="a in affiliations" :key="a.id">
            <sup class="num">{{ a.id }}</sup>
            <img :src="logos[a.id]" alt="" :class="'logo logo-' + a.id" />
            <span>{{ a.name }}</span>
          </li>
        </ul>
        <p v-if="authors.length" class="notes"><span v-for="(n, i) in authorNotes" :key="i">{{ n }}</span></p>
        <p class="ack">{{ t.credits.ack }}</p>
      </div>
      <div class="cite">
        <div class="cite-head">
          <h2>{{ t.credits.cite }}</h2>
          <button class="btn copy" :aria-label="t.credits.copyMain" @click="copy('main', bibtex)">
            <UiIcon :name="copied === 'main' ? 'check' : 'copy'" :size="18" />
            <span>{{ copied === 'main' ? t.credits.copied : t.credits.copy }}</span>
          </button>
        </div>
        <pre class="bib num"><template v-for="(line, i) in bibLines" :key="i"><template v-if="DRAFT && line.trim() === 'author={},'">  author={<span class="pending">{{ t.credits.authorsPending }}</span>},</template><template v-else>{{ line }}</template>{{ i < bibLines.length - 1 ? '\n' : '' }}</template></pre>
      </div>
    </div>
    <div class="wrap related">
      <div class="cite-head">
        <h3>{{ t.credits.related }}</h3>
        <button class="btn copy" :aria-label="t.credits.copyRelated" @click="copy('related', relatedBibtex)">
          <UiIcon :name="copied === 'related' ? 'check' : 'copy'" :size="18" />
          <span>{{ copied === 'related' ? t.credits.copied : t.credits.copyBoth }}</span>
        </button>
      </div>
      <div class="related-grid">
        <pre v-for="(entry, i) in relatedEntries" :key="i" class="bib num">{{ entry }}</pre>
      </div>
    </div>
    <footer class="wrap foot">
      <span class="brand" aria-label="SparkWM"><BrandMark :size="22" wordmark /></span>
      <span class="muted">2026</span>
    </footer>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 80px);
}
.team {
  display: grid;
  gap: 20px;
  align-content: start;
}
.authors {
  font-size: 17px;
}
.affs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.affs li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}
.affs sup {
  color: var(--ink2);
  font-weight: 500;
  width: 10px;
}
.logo {
  height: 28px;
  width: auto;
}
.logo-1 {
  filter: grayscale(1) contrast(1.5) brightness(0.8);
}
.logo-2 {
  height: 14px;
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
.notes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
  font-size: 13px;
  color: var(--ink3);
}
.ack {
  color: var(--ink2);
  font-size: 15px;
  max-width: 560px;
}
.cite {
  display: grid;
  gap: 16px;
  align-content: start;
}
.cite-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
/* the related entries sit under the two columns above, one card per column */
.related {
  display: grid;
  gap: 16px;
  margin-top: clamp(40px, 5vw, 72px);
}
.related-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 80px);
}
.copy {
  height: 38px;
  padding: 0 14px;
  font-size: 15px;
}
.bib {
  margin: 0;
  padding: 20px;
  border-radius: 8px;
  background: var(--bg2);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--ink);
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: clamp(64px, 8vw, 112px);
  padding-top: 24px;
  border-top: 1px solid var(--line);
  font-size: 15px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-stretch: 112%;
}
.muted {
  color: var(--ink2);
}
@media (max-width: 860px) {
  .grid,
  .related-grid {
    grid-template-columns: 1fr;
  }
  .related-grid {
    gap: 16px;
  }
}
</style>
