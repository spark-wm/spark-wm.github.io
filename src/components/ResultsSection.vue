<script setup lang="ts">
// Speed-up: headline factor, per-chunk time on one and four RTX 5090s, and an end-to-end latency chart
// (log scale). Every number comes from content.ts (efficiency.latency, efficiency.speed). Until they are
// measured, a DRAFT build shows one pending marker and equal-width placeholder bars (so no speed-up is
// implied); a release build hides the whole section.
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
const sp = efficiency.speed
const anyData = known || sp.oneGpu !== null || sp.fourGpu !== null
const show = anyData || DRAFT

// log axis from the decade below the fastest to the decade above the slowest
const lo = known ? Math.pow(10, Math.floor(Math.log10(Math.min(...rows.map((r) => r.seconds as number))))) : 1
const hi = known ? Math.pow(10, Math.ceil(Math.log10(Math.max(...rows.map((r) => r.seconds as number))))) : 1000
const pos = (v: number) => (Math.log10(v / lo) / Math.log10(hi / lo)) * 100
const ticks = computed(() => {
  const out: number[] = []
  for (let v = lo; v <= hi * 1.0001; v *= 10) out.push(v)
  return out
})
const width = (r: (typeof rows)[number]) => (known && r.seconds !== null ? pos(r.seconds) : 100)
const fmtS = (v: number) => (v >= 100 ? Math.round(v).toLocaleString() : v >= 10 ? v.toFixed(1) : v.toFixed(2))
const markerText = computed(() => (speedup === null ? '' : ui.lang === 'zh' ? `${Math.round(speedup)} 倍加速` : `${Math.round(speedup)}× faster`))
</script>

<template>
  <section v-if="show" id="results" ref="root" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ tr(R.title) }}</h2>
        <div class="head-copy">
          <p class="lead text muted-lead">{{ tr(R.body) }}</p>
          <p v-if="!anyData && DRAFT"><span class="pending">{{ tr(R.measuring) }}</span></p>
        </div>
      </div>

      <div class="stats">
        <div class="stat headline">
          <p class="stat-value num">
            <template v-if="speedup !== null">{{ Math.round(speedup) }}<span class="x">×</span></template>
            <span v-else class="dash" role="img" :aria-label="tr(t.pending)" />
          </p>
          <p class="stat-label">{{ tr(R.headline) }}</p>
        </div>
        <div class="stat">
          <p class="stat-value num">
            <template v-if="sp.oneGpu !== null">{{ sp.oneGpu.toFixed(2) }}<span class="u">s</span></template>
            <span v-else class="dash" role="img" :aria-label="tr(t.pending)" />
          </p>
          <p class="stat-label">{{ tr(R.perChunkOne) }}</p>
        </div>
        <div class="stat">
          <p class="stat-value num">
            <template v-if="sp.fourGpu !== null">{{ sp.fourGpu.toFixed(2) }}<span class="u">s</span></template>
            <span v-else class="dash" role="img" :aria-label="tr(t.pending)" />
          </p>
          <p class="stat-label">{{ tr(R.perChunkFour) }}</p>
        </div>
      </div>

      <figure class="chart" :class="{ skeleton: !known, grow }">
        <figcaption class="chart-head">
          <span class="chart-title">{{ tr(R.latencyTitle) }}</span>
          <span v-if="efficiency.latency.setup" class="chart-setup">{{ tr(efficiency.latency.setup) }}</span>
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
              <span class="bar" :style="{ width: grow ? width(r) + '%' : '0%', transitionDelay: i * 0.2 + 's' }" />
              <span class="val num">
                <template v-if="r.seconds !== null">{{ fmtS(r.seconds) }} s</template>
                <span v-else class="dash small" role="img" :aria-label="tr(t.pending)" />
              </span>
            </div>
          </div>
          <div v-if="speedup !== null" class="marker" :style="{ left: `calc(var(--who) + (100% - var(--who)) * ${width(ours) / 100})` }">
            <span class="marker-label num">{{ markerText }}</span>
          </div>
        </div>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.muted-lead {
  color: var(--ink2);
}
.head-copy {
  display: grid;
  gap: 14px;
  justify-items: start;
}
.stats {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.stat {
  --pending-ink: var(--stage-ink2);
  --pending-line: var(--stage-line);
  padding: 22px 24px 20px;
  border-radius: 14px;
  background: var(--stage);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-edge);
  display: grid;
  align-content: space-between;
  gap: 14px;
  min-height: 132px;
}
.stat.headline {
  background: linear-gradient(135deg, rgba(255, 106, 0, 0.2), rgba(255, 106, 0, 0.04) 60%), var(--stage);
  box-shadow: inset 0 0 0 1px rgba(255, 106, 0, 0.35);
}
.stat-value {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 700;
  font-stretch: 110%;
  line-height: 1;
  letter-spacing: -0.03em;
}
.stat:not(.headline) .stat-value {
  font-size: clamp(36px, 4vw, 52px);
}
/* a short rule stands in for a number not measured yet */
.dash {
  display: inline-block;
  width: 0.7em;
  height: 0.07em;
  min-height: 3px;
  margin: 0.45em 0 0.1em;
  border-radius: 2px;
  background: var(--stage-ink3);
}
.dash.small {
  width: 18px;
  height: 2px;
  min-height: 2px;
  margin: 0;
  vertical-align: middle;
}
.x {
  font-size: 0.6em;
  color: var(--stage-accent);
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
  --who: 210px;
  margin: 0;
  padding: 24px 26px 28px;
  border-radius: 14px;
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
.skeleton .plot {
  padding-top: 0;
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
  font-size: 13px;
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
  font-size: 17px;
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
  gap: 14px;
  height: 36px;
}
.bar {
  height: 100%;
  border-radius: 8px;
  background: var(--stage-ink3);
  transition: width 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.ours .bar {
  background: linear-gradient(90deg, #ff6a00, #ffb800);
}
.skeleton .bar {
  background: var(--stage3);
}
.skeleton .ours .bar {
  background: rgba(255, 106, 0, 0.22);
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
}
@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
