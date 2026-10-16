<script setup lang="ts">
import type { WithClassAsProps } from "./interface"
import { cn } from '@/core/lib/utils'
import { useCarousel } from "./useCarousel"
import type { ComponentPublicInstance } from "vue"

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<WithClassAsProps>()

const { carouselRef, orientation } = useCarousel()

// Attach the embla root explicitly: a ref that is only bound in the template
// is reported as unused by vue-tsc 3 (noUnusedLocals).
function bindCarouselRef(el: Element | ComponentPublicInstance | null) {
  carouselRef.value = (el as HTMLElement | null) ?? undefined
}
</script>

<template>
  <div
    :ref="bindCarouselRef"
    data-slot="carousel-content"
    class="overflow-hidden"
  >
    <div
      :class="
        cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          props.class,
        )"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </div>
</template>
