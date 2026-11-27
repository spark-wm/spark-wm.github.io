<script setup lang="ts">
import { mediaPath, rolloutClips, t } from '../content'
</script>

<template>
  <section id="rollout" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ t.rollout.title }}</h2>
        <p class="lead text muted-lead">{{ t.rollout.body }}</p>
      </div>
      <div class="rows">
        <figure v-for="c in rolloutClips" :key="c.id" class="row">
          <figcaption class="name">{{ c.title }}</figcaption>
          <ol class="frames">
            <li v-for="(s, i) in c.meta.revisit" :key="i">
              <img :src="mediaPath(c.id, `at${i}.webp`)" :alt="`${c.title} ${Math.round(s)} s`" loading="lazy" />
              <span class="at num">{{ Math.round(s) }} s</span>
            </li>
          </ol>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.muted-lead {
  color: var(--ink2);
}
.rows {
  display: grid;
  gap: 40px;
}
.row {
  margin: 0;
  display: grid;
  gap: 12px;
}
.name {
  font-weight: 600;
  font-size: 17px;
}
.frames {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.frames li {
  display: grid;
  gap: 8px;
}
.frames img {
  width: 100%;
  aspect-ratio: 1344 / 768;
  object-fit: cover;
  border-radius: 4px;
  background: var(--bg2);
}
.at {
  font-size: 14px;
  color: var(--ink2);
}
@media (max-width: 760px) {
  .frames {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .frames li:nth-child(2),
  .frames li:nth-child(4) {
    display: none;
  }
}
</style>
