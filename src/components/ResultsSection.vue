<script setup lang="ts">
// Speed-up: headline factor, per-chunk time, an end-to-end latency chart (log scale) and the step /
// attention comparison with H3. Every number comes from content.ts; empty ones show a pending marker
// in DRAFT builds, and the chart draws a skeleton until both latencies are filled.
import { computed, ref } from 'vue'
import { DRAFT, efficiency, t } from '../content'
import { tr, ui } from '../state'
import { useInView } from '../composables/useInView'

const R = t.results
const root = ref<HTMLElement | null>(null)
const seen = useInView(root, { ratio: 0.2 })
const grow = computed(() => seen.value || ui.reducedMotion)

const rows = efficiency.latency.rows
const base = rows[0]
const ours = rows.find((r) => r.ours) ?? rows[rows.length - 1]
const known = rows.every((r) => r.seconds !== null)
const speedup = known && base.seconds && ours.seconds ? base.seconds / ours.seconds : null

// log axis from the decade below the fastest to the decade above the slowest
const lo = known ? Math.pow(10, Math.floor(Math.log10(Math.min(...rows.map((r) => r.seconds as number))))) : 1
const hi = known ? Math.pow(10, Math.ceil(Math.log10(Math.max(...rows.map((r) => r.seconds as number))))) : 1000
const pos = (v: number) => (Math.log10(v / lo) / Math.log10(hi / lo)) * 100
const ticks = computed(() => {
  const out: number[] = []
  for (let v = lo; v <= hi * 1.0001; v *= 10) out.push(v)
  return out
})
const width = (r: (typeof rows)[number], i: number) => (r.seconds !== null && known ? pos(r.seconds) : i === 0 ? 92 : 26)
const fmtS = (v: number) => (v >= 100 ? Math.round(v).toLocaleString() : v >= 10 ? v.toFixed(1) : v.toFixed(2))

const sp = efficiency.speed
</script>

<template>
  <section id="results" ref="root" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ tr(R.title) }}</h2>
        <p class="lead text muted-lead">{{ tr(R.body) }}</p>
      </div>

      <div class="stats">
        <div class="stat headline">
          <p class="stat-value num">
            <template v-if="speedup !== null">{{ Math.round(speedup) }}<span class="x">×</span></template>
            <template v-else><span class="x ghost">×</span><span v-if="DRAFT" class="pending">{{ tr(t.pending) }}</span></template>
          </p>
          <p class="stat-label">{{ tr(R.headline) }}</p>
        </div>
        <div class="stat">
          <p class="stat-value num">
            <template v-if="sp.oneGpu !== null">{{ sp.oneGpu.toFixed(2) }}<span class="u">s</span></template>
            <span v-else-if="DRAFT" class="pending">{{ tr(t.pending) }}</span>
          </p>
          <p class="stat-label">{{ tr(R.perChunkOne) }}</p>
        </div>
        <div class="stat">
          <p class="stat-value num">
            <template v-if="sp.fourGpu !== null">{{ sp.fourGpu.toFixed(2) }}<span class="u">s</span></template>
            <span v-else-if="DRAFT" class="pending">{{ tr(t.pending) }}</span>
          </p>
          <p class="stat-label">{{ tr(R.perChunkFour) }}</p>
        </div>
      </div>

      <figure class="chart" :class="{ skeleton: !known, grow }">
        <figcaption class="chart-head">
          <span class="chart-title">{{ tr(R.latencyTitle) }}</span>
          <span v-if="efficiency.latency.setup" class="chart-setup">{{ tr(efficiency.latency.setup) }}</span>
          <span v-else-if="DRAFT" class="pending">{{ tr(R.setupPending) }}</span>
        </figcaption>
        <div class="plot">
          <div v-if="known" class="axis" aria-hidden="true">
            <span v-for="v in ticks" :key="v" class="tick num" :style="{ left: pos(v) + '%' }">{{ v.toLocaleString() }} s</span>
          </div>
          <div v-for="(r, i) in rows" :key="i" class="row" :class="{ ours: r.ours }">
            <div class="who">
              <p class="who-name">{{ tr(r.name) }}</p>
              <p class="who-note">{{ tr(r.note) }}</p>
            </div>
            <div class="track">
              <span class="bar" :style="{ width: grow ? width(r, i) + '%' : '0%', transitionDelay: i * 0.2 + 's' }" />
              <span class="val num">
                <template v-if="r.seconds !== null">{{ fmtS(r.seconds) }} s</template>
                <span v-else-if="DRAFT" class="pending">{{ tr(t.pending) }}</span>
              </span>
            </div>
          </div>
          <div v-if="speedup !== null" class="marker" :style="{ left: `calc(var(--who) + (100% - var(--who)) * ${width(ours, 1) / 100})` }">
            <span class="marker-label num">{{ ui.lang === 'zh' ? `快 ${Math.round(speedup)} 倍` : `${Math.round(speedup)}× faster` }}</span>
          </div>
        </div>
      </figure>

      <div class="cmp">
        <h3 class="cmp-title">{{ tr(t.method.compareTitle) }}</h3>
        <div v-for="(r, i) in efficiency.rows" :key="i" class="cmp-row">
          <p class="cmp-label">{{ tr(r.label) }}</p>
          <div class="bars">
            <div class="bar-line">
              <span class="cmp-who">{{ tr(t.efficiency.before) }}</span>
              <span class="cmp-track"><span class="fill before" :style="{ width: grow ? '100%' : '0%' }" /></span>
              <span class="cmp-val num">{{ tr(r.beforeText) }}</span>
            </div>
            <div class="bar-line">
              <span class="cmp-who strong">{{ tr(t.efficiency.after) }}</span>
              <span class="cmp-track"><span class="fill after" :style="{ width: grow ? (100 * r.after) / r.before + '%' : '0%', transitionDelay: '0.25s' }" /></span>
              <span class="cmp-val num strong">{{ tr(r.afterText) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.muted-lead {
  color: var(--ink2);
}
.stats {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
.stat {
  padding: 22px 22px 20px;
  border-radius: 12px;
  background: var(--stage);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-edge);
  display: grid;
  align-content: space-between;
  gap: 14px;
  min-height: 150px;
}
.stat.headline {
  background: linear-gradient(135deg, rgba(255, 106, 0, 0.22), rgba(255, 106, 0, 0.05) 60%), var(--stage);
  box-shadow: inset 0 0 0 1px rgba(255, 106, 0, 0.4);
}
.stat-value {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 750;
  font-stretch: 110%;
  line-height: 1;
  letter-spacing: -0.03em;
}
.stat:not(.headline) .stat-value {
  font-size: clamp(36px, 4vw, 52px);
}
.x {
  font-size: 0.6em;
  color: var(--stage-accent);
}
.x.ghost {
  opacity: 0.5;
}
.u {
  font-size: 0.45em;
  color: var(--stage-ink2);
}
.stat-label {
  font-size: 15px;
  color: var(--stage-ink2);
}
.chart {
  --who: 200px;
  margin: 0;
  padding: 22px 24px 26px;
  border-radius: 12px;
  background: var(--stage);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-edge);
}
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.chart-title {
  font-size: 17px;
  font-weight: 650;
}
.chart-setup {
  font-size: 14px;
  color: var(--stage-ink2);
}
.plot {
  position: relative;
  display: grid;
  gap: 18px;
  padding-top: 26px;
}
.axis {
  position: absolute;
  left: var(--who);
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
}
.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--stage-ink3);
  border-left: 1px dashed var(--stage-line);
  padding-left: 4px;
}
.row {
  display: grid;
  grid-template-columns: var(--who) minmax(0, 1fr);
  align-items: center;
}
.who-name {
  font-size: 16px;
  font-weight: 650;
}
.ours .who-name {
  color: var(--stage-accent);
}
.who-note {
  font-size: 13px;
  color: var(--stage-ink2);
}
.track {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 34px;
}
.bar {
  height: 100%;
  border-radius: 6px;
  background: var(--stage-ink3);
  transition: width 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.ours .bar {
  background: linear-gradient(90deg, #ff6a00, #ffb800);
}
.skeleton .bar {
  background: repeating-linear-gradient(135deg, var(--stage3) 0 6px, transparent 6px 12px);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.skeleton .ours .bar {
  background: repeating-linear-gradient(135deg, rgba(255, 106, 0, 0.35) 0 6px, transparent 6px 12px);
  box-shadow: inset 0 0 0 1px rgba(255, 106, 0, 0.45);
}
.val {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}
.marker {
  position: absolute;
  top: 18px;
  bottom: -8px;
  border-left: 1.5px dashed var(--stage-accent);
}
.marker-label {
  position: absolute;
  top: -2px;
  left: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--stage-accent);
  white-space: nowrap;
}
.cmp {
  display: grid;
  margin-top: clamp(48px, 6vw, 80px);
  border-top: 1px solid var(--line2);
}
.cmp-title {
  padding: 20px 0 4px;
}
.cmp-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
  align-items: center;
}
.cmp-label {
  font-size: 18px;
  font-weight: 600;
}
.bars {
  display: grid;
  gap: 10px;
}
.bar-line {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) 210px;
  gap: 14px;
  align-items: center;
}
.cmp-who {
  font-size: 15px;
  color: var(--ink2);
}
.strong {
  color: var(--ink);
  font-weight: 650;
}
.cmp-track {
  height: 14px;
  border-radius: 3px;
  background: var(--bg2);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 1.1s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.fill.before {
  background: var(--ink3);
}
.fill.after {
  background: linear-gradient(90deg, #ff6a00, #ffb800);
}
.cmp-val {
  font-size: 15px;
  color: var(--ink2);
}
@media (max-width: 860px) {
  .stats {
    grid-template-columns: 1fr 1fr;
  }
  .stat.headline {
    grid-column: 1 / -1;
  }
  .chart {
    --who: 0px;
    padding: 18px 16px 20px;
  }
  .row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .axis,
  .marker {
    display: none;
  }
  .cmp-row {
    grid-template-columns: 1fr;
  }
  .bar-line {
    grid-template-columns: 64px minmax(0, 1fr);
  }
  .cmp-val {
    grid-column: 2;
    margin-top: -6px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bar,
  .fill {
    transition: none;
  }
}
</style>
