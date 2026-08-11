<script setup lang="ts">
import { useLocaleStore } from '@/core/i18n/locale.store'

const locale = useLocaleStore()
</script>

<template>
  <article class="space-y-5 text-sm leading-relaxed text-foreground">
    <p class="text-muted-foreground">
      {{ locale.t.legal.offerIntro }}
    </p>

    <section
      v-for="(section, index) in locale.t.legal.offerSections"
      :key="index"
      class="space-y-1.5"
    >
      <h2 class="text-[15px] font-semibold text-foreground">
        {{ section.title }}
      </h2>
      <p class="text-muted-foreground">
        {{ section.body }}
      </p>
    </section>
  </article>
</template>
