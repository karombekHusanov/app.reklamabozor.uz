<script setup lang="ts">
import { Download } from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import {
  fetchPublicOffer,
  type PublicOffer,
  type PublicOfferKind,
  type PublicOfferLocale,
} from '../services/public-offer.service'

const props = withDefaults(defineProps<{
  kind?: PublicOfferKind
}>(), {
  kind: 'client',
})

const emit = defineEmits<{
  loaded: []
}>()

const locale = useLocaleStore()

const offer = ref<PublicOffer | null>(null)
const loading = ref(true)
const failed = ref(false)
/** Reader switched to the binding Uzbek Cyrillic original. */
const showingOriginal = ref(false)

let requestId = 0

async function load() {
  const id = ++requestId
  const target: PublicOfferLocale = showingOriginal.value ? 'uz-Cyrl' : locale.locale
  loading.value = true
  failed.value = false
  try {
    const result = await fetchPublicOffer(props.kind, target)
    if (id !== requestId) return
    offer.value = result
    emit('loaded')
  }
  catch {
    if (id === requestId) failed.value = true
  }
  finally {
    if (id === requestId) loading.value = false
  }
}

function toggleOriginal() {
  showingOriginal.value = !showingOriginal.value
  load()
}

onMounted(load)

// The app language changed — follow it (and drop back to the translation).
watch(() => locale.locale, () => {
  showingOriginal.value = false
  load()
})
</script>

<template>
  <div
    v-if="loading"
    class="space-y-3"
  >
    <Skeleton class="h-11 w-full rounded-2xl" />
    <Skeleton class="h-5 w-2/3" />
    <Skeleton class="h-24 w-full" />
    <Skeleton class="h-24 w-full" />
  </div>

  <div
    v-else-if="failed || !offer"
    class="space-y-3 text-center text-sm text-muted-foreground"
  >
    <p>{{ locale.t.legal.loadError }}</p>
    <button
      type="button"
      class="pressable text-primary underline underline-offset-2"
      @click="load"
    >
      {{ locale.t.common.retry }}
    </button>
  </div>

  <article
    v-else
    class="space-y-5 text-sm leading-relaxed text-foreground"
  >
    <a
      :href="offer.pdf_url"
      target="_blank"
      rel="noopener"
      class="pressable flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
    >
      <Download class="size-4" />
      {{ locale.t.legal.download }}
    </a>

    <div class="space-y-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
      <p v-if="offer.translation_notice">
        {{ offer.translation_notice }}
      </p>
      <p
        v-else
        class="font-medium text-foreground"
      >
        {{ locale.t.legal.originalBadge }}
      </p>
      <button
        type="button"
        class="pressable min-h-11 font-semibold text-primary underline underline-offset-2"
        @click="toggleOriginal"
      >
        {{ showingOriginal ? locale.t.legal.showTranslation : locale.t.legal.showOriginal }}
      </button>
    </div>

    <h2 class="rb-font-display text-center text-[15px] font-extrabold leading-snug tracking-[-0.01em]">
      {{ offer.title }}
    </h2>

    <section
      v-for="section in offer.sections"
      :key="section.title"
      class="space-y-2"
    >
      <h3 class="rb-font-display text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
        {{ section.title }}
      </h3>
      <p
        v-for="(clause, index) in section.clauses"
        :key="index"
        class="text-muted-foreground"
      >
        <b
          v-if="clause.label"
          class="font-semibold text-foreground"
        >{{ clause.label }}</b>
        {{ clause.text }}
      </p>
    </section>

    <section class="space-y-2">
      <h3 class="rb-font-display text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
        {{ offer.requisites_title }}
      </h3>
      <dl class="space-y-1.5 rounded-2xl border border-border bg-card p-3 text-[13px]">
        <div
          v-for="row in offer.requisites"
          :key="row.label"
        >
          <dt class="text-muted-foreground">
            {{ row.label }}
          </dt>
          <dd class="font-medium text-foreground">
            {{ row.value }}
          </dd>
        </div>
      </dl>
    </section>
  </article>
</template>
