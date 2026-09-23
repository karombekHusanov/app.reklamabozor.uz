import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePassStore } from '@/modules/agent/stores/pass.store'

/** Hours/minutes remaining on the current Propusk (live, second-resolution source). */
export function usePassCountdown() {
  const { secondsLeft } = storeToRefs(usePassStore())
  const hours = computed(() => Math.floor(secondsLeft.value / 3600))
  const minutes = computed(() => Math.floor((secondsLeft.value % 3600) / 60))
  return { hours, minutes, secondsLeft }
}
