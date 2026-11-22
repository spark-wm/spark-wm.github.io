<script setup lang="ts">
// Bare page for exporting the training animation: index.html?record=pipeline&lang=zh
import { ref } from 'vue'
import { t } from '../content'
import { tr, ui } from '../state'
import PipelineFigure from './PipelineFigure.vue'

const q = new URLSearchParams(location.search)
if (q.get('lang') === 'en' || q.get('lang') === 'zh') ui.lang = q.get('lang') as 'en' | 'zh'
const stage = ref(Number(q.get('stage') || 0))
const N = t.training.stages.length
function next() { stage.value = (stage.value + 1) % N; (window as unknown as { __stage: number }).__stage = stage.value }
const name = (i: number) => (ui.lang === 'zh' ? `阶段 ${i + 1}：` : `Stage ${i + 1}: `) + tr(t.training.stages[i].name)
</script>

<template>
  <div class="rec">
    <div class="frame">
      <PipelineFigure :stage="stage" @cycle="next" />
      <div class="foot">
        <span class="name">{{ name(stage) }}</span>
        <span class="rail"><i v-for="i in N" :key="i" :class="{ on: i - 1 === stage, done: i - 1 < stage }" /></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rec {
  width: 960px;
  height: 680px;
  background: #0e0d0b;
  display: grid;
  place-items: center;
  --stage: #0e0d0b;
  --stage2: #191713;
  --stage3: #24211c;
  --stage-ink: #ede8df;
  --stage-ink2: #a29b8f;
  --stage-ink3: #6e685e;
  --stage-line: rgba(237, 232, 223, 0.14);
  color: var(--stage-ink);
}
.frame {
  width: 900px;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--stage-line);
}
.name {
  font-size: 22px;
  font-weight: 650;
}
.rail {
  display: grid;
  grid-template-columns: repeat(7, 34px);
  gap: 6px;
}
.rail i {
  display: block;
  height: 5px;
  border-radius: 3px;
  background: var(--stage3);
}
.rail i.done {
  background: var(--stage-ink3);
}
.rail i.on {
  background: #ff5a1f;
}
.frame :deep(.lbl) {
  font-size: 22px;
}
</style>
