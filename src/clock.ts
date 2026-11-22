// One clock for all animations. Recording mode (tools/record_pipeline.mjs) freezes it and steps it
// frame by frame through window.__setTime(ms), so exported GIF/MP4 frames are exact.
let fixed: number | null =
  typeof window !== 'undefined' && typeof (window as unknown as { __fixedInit?: number }).__fixedInit === 'number'
    ? (window as unknown as { __fixedInit: number }).__fixedInit
    : null

export const clock = {
  now: (): number => (fixed === null ? performance.now() : fixed),
  frozen: (): boolean => fixed !== null,
}

declare global {
  interface Window { __setTime?: (ms: number) => void }
}

if (typeof window !== 'undefined') {
  window.__setTime = (ms: number) => { fixed = ms }
}
