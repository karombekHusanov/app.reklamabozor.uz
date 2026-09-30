import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Count, not a boolean, so overlapping mount/unmount during page transitions stays correct.
const holders = ref(0)

/** True while any mounted component asked to hide the global tab bar. */
export const tabBarForcedHidden = computed(() => holders.value > 0)

/** Hide the global tab bar while the calling component is mounted (e.g. it docks its own action bar). */
export function useHideTabBar() {
  onMounted(() => { holders.value += 1 })
  onBeforeUnmount(() => { holders.value = Math.max(0, holders.value - 1) })
}
