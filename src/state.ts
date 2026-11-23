import { reactive, watch } from 'vue'
import type { L, Lang } from './content'

function initialLang(): Lang {
  try {
    const s = localStorage.getItem('sparkwm-lang')
    if (s === 'en' || s === 'zh') return s
  } catch { /* storage blocked */ }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function initialTheme(): 'auto' | 'light' | 'dark' {
  try {
    const s = localStorage.getItem('sparkwm-theme')
    if (s === 'light' || s === 'dark') return s
  } catch { /* storage blocked */ }
  // the page is designed dark first; the toggle still offers light
  return 'dark'
}

export const ui = reactive({
  lang: initialLang(),
  theme: initialTheme(),
  /** The visitor wants sound. Only the audible player actually plays it. */
  sound: false,
  /** id of the player allowed to make sound (the one most in view, or the one last touched). */
  audible: '' as string,
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
})

export const tr = (x: L) => x[ui.lang]

/** A request from the hero reel to open a clip in the demo theater; `n` counts requests so a repeat still fires. */
export const demoPick = reactive({ id: '', n: 0 })

watch(() => ui.lang, (l) => {
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  try { localStorage.setItem('sparkwm-lang', l) } catch { /* ignore */ }
}, { immediate: true })

watch(() => ui.theme, (th) => {
  if (th === 'auto') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = th
  try { th === 'auto' ? localStorage.removeItem('sparkwm-theme') : localStorage.setItem('sparkwm-theme', th) } catch { /* ignore */ }
}, { immediate: true })

export function isDark(): boolean {
  if (ui.theme !== 'auto') return ui.theme === 'dark'
  return matchMedia('(prefers-color-scheme: dark)').matches
}

/** Visible-area bookkeeping so that sound follows the player most in view. */
const visibility = new Map<string, number>()
export function reportVisibility(id: string, ratio: number) {
  visibility.set(id, ratio)
  let best = ''
  let bestR = 0.35
  for (const [k, v] of visibility) if (v > bestR) { best = k; bestR = v }
  if (best && best !== ui.audible) ui.audible = best
}
