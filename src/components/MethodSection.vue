<script setup lang="ts">
import { clips, t } from '../content'
import { tr } from '../state'
import AccelOverview from './AccelOverview.vue'
import ChunkFigure from './ChunkFigure.vue'
import SparseFigure from './SparseFigure.vue'
import QuantFigure from './QuantFigure.vue'

</script>

<template>
  <section id="method" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ tr(t.method.title) }}</h2>
        <p class="lead text muted">{{ tr(t.method.body) }}</p>
      </div>

      <AccelOverview />

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.chunkTitle) }}</h3>
          <p>{{ tr(t.method.chunkBody) }}</p>
        </div>
        <div class="figure">
          <ChunkFigure :clip="clips[0]" />
          <p class="caption">{{ tr(t.method.chunkCaption) }}</p>
        </div>
      </div>

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.sparseTitle) }}</h3>
          <p>{{ tr(t.method.sparseBody) }}</p>
        </div>
        <div class="figure">
          <SparseFigure />
          <p class="caption">{{ tr(t.method.sparseCaption) }}</p>
        </div>
      </div>

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.quantTitle) }}</h3>
          <p>{{ tr(t.method.quantBody) }}</p>
        </div>
        <div class="figure">
          <QuantFigure />
          <p class="caption">{{ tr(t.method.quantCaption) }}</p>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.muted {
  color: var(--ink2);
}
.part {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
  gap: clamp(24px, 4vw, 64px);
  align-items: start;
}
.part + .part {
  margin-top: clamp(56px, 7vw, 96px);
}
.copy {
  display: grid;
  gap: 16px;
  position: sticky;
  top: 96px;
}
.copy p {
  color: var(--ink2);
}
.figure {
  display: grid;
  gap: 12px;
}
@media (max-width: 980px) {
  .part {
    grid-template-columns: 1fr;
  }
  .copy {
    position: static;
    max-width: var(--text);
  }
}
</style>
