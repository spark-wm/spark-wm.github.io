import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** true once (or while, with `live`) the element is at least `ratio` visible. */
export function useInView(el: Ref<Element | null>, opts: { ratio?: number; live?: boolean; margin?: string } = {}) {
  const inView = ref(false)
  let io: IntersectionObserver | null = null
  onMounted(() => {
    if (!el.value) return
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const on = e.isIntersecting && e.intersectionRatio >= (opts.ratio ?? 0.2)
        if (opts.live) inView.value = on
        else if (on) { inView.value = true; io?.disconnect() }
      }
    }, { threshold: [0, opts.ratio ?? 0.2, 1], rootMargin: opts.margin ?? '0px' })
    io.observe(el.value)
  })
  onBeforeUnmount(() => io?.disconnect())
  return inView
}
