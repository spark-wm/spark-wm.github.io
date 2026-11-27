<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { t } from '../content'
import { ui } from '../state'
import { useInView } from '../composables/useInView'
import PipelineFigure from './PipelineFigure.vue'
import UiIcon from './UiIcon.vue'

const N = t.training.stages.length
const active = ref(0)
const steps = ref<HTMLElement[]>([])
const fig = ref<HTMLElement | null>(null)
const inView = useInView(fig, { ratio: 0.2, live: true })
const paused = ref(false)
const hyperOpen = ref(false)
const wide = ref(typeof window !== 'undefined' && window.innerWidth > 980)
const playing = computed(() => inView.value && !paused.value)
let io: IntersectionObserver | null = null

const onResize = () => { wide.value = window.innerWidth > 980 }
onMounted(() => {
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) active.value = Number((e.target as HTMLElement).dataset.i)
  }, { rootMargin: wide.value ? '-42% 0px -48% 0px' : '-58% 0px -30% 0px' })
  steps.value.forEach((el) => io!.observe(el))
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => { io?.disconnect(); window.removeEventListener('resize', onResize) })

function onCycle() { /* each stage loops in place; the reader's scroll position picks the stage */ }
function pick(i: number) {
  active.value = i
  steps.value[i]?.scrollIntoView({ behavior: ui.reducedMotion ? 'auto' : 'smooth', block: wide.value ? 'center' : 'end' })
}
const heading = (i: number) => `${t.training.stageWord} ${i + 1}: `
const current = computed(() => heading(active.value) + t.training.stages[active.value].name)
</script>

<template>
  <section id="training" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ t.training.title }}</h2>
        <p class="lead text muted-lead">{{ t.training.body }}</p>
      </div>

      <div class="layout">
        <div class="sticky">
          <figure ref="fig" class="panel">
            <PipelineFigure :stage="active" :playing="playing" @cycle="onCycle" />
            <figcaption class="cap">
              <span class="cap-name">{{ current }}</span>
              <button class="pp" :aria-label="paused ? t.training.fig.play : t.training.fig.pause" @click="paused = !paused">
                <UiIcon :name="paused ? 'play' : 'pause'" :size="16" />
              </button>
            </figcaption>
          </figure>
          <ol class="rail" :aria-label="t.training.title">
            <li v-for="i in N" :key="i">
              <button :class="{ on: i - 1 === active, done: i - 1 < active }" :aria-label="heading(i - 1) + t.training.stages[i - 1].name" @click="pick(i - 1)"><span class="bar" /></button>
            </li>
          </ol>
        </div>

        <ol class="steps">
          <li v-for="(st, i) in t.training.stages" :key="i" ref="steps" :data-i="i" class="step" :class="{ on: i === active }" @click="active = i">
            <h3><span class="k">{{ heading(i) }}</span>{{ st.name }}</h3>
            <p>{{ st.body }}</p>
          </li>
        </ol>
      </div>

      <details class="hyper" @toggle="hyperOpen = ($event.target as HTMLDetailsElement).open">
        <summary>{{ t.training.hyperTitle }}<UiIcon name="chevron" :size="18" class="chev" /></summary>
        <dl v-if="hyperOpen">
          <div v-for="(r, i) in t.training.hyper" :key="i" class="hrow">
            <dt>{{ r.k }}</dt>
            <dd class="num">{{ r.v }}</dd>
          </div>
        </dl>
      </details>
    </div>
  </section>
</template>

<style scoped>
.muted-lead {
  color: var(--ink2);
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 80px);
}
.sticky {
  position: sticky;
  top: 96px;
  align-self: start;
}
.panel {
  margin: 0;
  background: var(--stage);
  color: var(--stage-ink);
  border-radius: 10px;
  padding: 20px 20px 12px;
}
.cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--stage-line);
}
.cap-name {
  font-size: 15px;
  font-weight: 600;
  visibility: hidden;
}
.pp {
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  color: var(--stage-ink2);
}
.pp:hover {
  color: var(--stage-ink);
  background: var(--stage3);
}
.rail {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.rail button {
  width: 100%;
  padding: 11px 0;
}
.rail .bar {
  display: block;
  height: 4px;
  border-radius: 2px;
  background: var(--line2);
  transition: background-color 0.3s;
}
.rail button.done .bar {
  background: var(--ink3);
}
.rail button.on .bar {
  background: var(--accent);
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
}
.step {
  min-height: 32vh;
  padding: 6px 0 40px;
  display: grid;
  align-content: start;
  gap: 14px;
  cursor: pointer;
}
.step h3 {
  color: var(--ink2);
  transition: color 0.3s;
}
.step h3 .k {
  transition: color 0.3s;
}
.step.on h3 {
  color: var(--ink);
}
.step.on h3 .k {
  color: var(--accent-ink);
}
.step p {
  color: var(--ink2);
  max-width: 560px;
}
.step:last-child {
  min-height: 0;
}
.hyper {
  margin-top: clamp(32px, 4vw, 56px);
  border-top: 1px solid var(--line2);
  border-bottom: 1px solid var(--line);
}
.hyper summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 0;
  font-size: 18px;
  font-weight: 600;
}
.hyper summary::-webkit-details-marker {
  display: none;
}
.hyper .chev {
  color: var(--ink2);
  transition: transform 0.2s;
}
.hyper[open] .chev {
  transform: rotate(180deg);
}
.hyper dl {
  margin: 0 0 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 clamp(24px, 4vw, 64px);
}
.hrow {
  display: grid;
  grid-template-columns: minmax(0, 11em) minmax(0, 1fr);
  gap: 16px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-size: 15px;
}
.hrow dt {
  color: var(--ink2);
}
.hrow dd {
  margin: 0;
}
@media (max-width: 980px) {
  .hyper dl {
    grid-template-columns: 1fr;
  }
  .hrow {
    grid-template-columns: minmax(0, 8em) minmax(0, 1fr);
  }
  .layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .sticky {
    top: 64px;
    z-index: 4;
    background: var(--bg);
    padding-bottom: 4px;
  }
  .panel {
    padding: 12px 12px 8px;
  }
  .cap-name {
    visibility: visible;
  }
  .rail {
    margin-top: 6px;
  }
  .steps {
    padding-bottom: 30vh;
  }
  .step {
    min-height: 0;
    padding: 0 0 32px;
  }
}
</style>
