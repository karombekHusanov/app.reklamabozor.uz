import type { Directive } from 'vue'

/**
 * `v-reveal` — fades a home section in once as it scrolls into view.
 * Adds `.rb-scroll-reveal` (hidden) then `.is-in` (shown). Under
 * reduced-motion, or without IntersectionObserver, the element is shown at once.
 */
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-in')
      observer?.unobserve(entry.target)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
  return observer
}

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const io = reduce ? null : getObserver()
    el.classList.add('rb-scroll-reveal')
    if (!io) {
      el.classList.add('is-in')
      return
    }
    io.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
