import { onMounted, onUnmounted, ref } from 'vue'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

export function usePullToRefresh({ onRefresh, threshold = 72 }: PullToRefreshOptions) {
  const pullDistance = ref(0)
  const isPulling = ref(false)

  let startY = 0
  let active = false

  function canPull(): boolean {
    return window.scrollY <= 0
  }

  function onTouchStart(event: TouchEvent) {
    if (!canPull() || isPulling.value) return
    startY = event.touches[0]?.clientY ?? 0
    active = true
  }

  function onTouchMove(event: TouchEvent) {
    if (!active || isPulling.value) return

    const currentY = event.touches[0]?.clientY ?? 0
    const delta = currentY - startY

    if (delta > 0 && canPull()) {
      pullDistance.value = Math.min(delta * 0.45, threshold * 1.5)
      if (pullDistance.value > 8) event.preventDefault()
    }
    else if (delta <= 0) {
      pullDistance.value = 0
    }
  }

  async function onTouchEnd() {
    if (!active) return
    active = false

    if (pullDistance.value >= threshold && !isPulling.value) {
      isPulling.value = true
      try {
        await onRefresh()
      }
      finally {
        isPulling.value = false
      }
    }

    pullDistance.value = 0
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })

  return {
    pullDistance,
    isPulling,
  }
}
