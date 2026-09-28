<script setup lang="ts">
import { Check, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/** Top agencies as tall coloured cards: rating, verified seal, logo, name, service · jobs. */
defineProps<{ agents: PublicAgent[] }>()

const locale = useLocaleStore()
const router = useRouter()

/** Card tints (decorative), darkened enough for white text. */
const TINTS = ['#3f5a8a', '#855757', '#476d69', '#5b4a8a', '#7a5a2e']

function service(agent: PublicAgent): string {
  return agent.categories[0] ? categoryName(agent.categories[0], locale.locale) : ''
}
</script>

<template>
  <section
    v-if="agents.length"
    class="car"
  >
    <div class="car__head">
      <h2 class="car__title">
        {{ locale.t.clientHome.topAgencies }}
      </h2>
      <button
        type="button"
        class="car__all"
        @click="router.push(ROUTES.agencies)"
      >
        {{ locale.t.clientHome.all }}
      </button>
    </div>
    <div class="car__rail">
      <button
        v-for="(agent, i) in agents"
        :key="agent.id"
        type="button"
        class="car__card"
        :style="{ background: TINTS[i % TINTS.length] }"
        @click="router.push(`/agents/${agent.id}`)"
      >
        <span class="car__top">
          <span class="car__pill">
            <Star class="size-3.5 fill-[var(--rb-rating)] text-[var(--rb-rating)]" />
            {{ agent.stars_count ? agent.stars?.toFixed(1) : locale.t.clientHome.new }}
          </span>
          <span
            class="car__seal"
            :aria-label="locale.t.clientHome.verified"
          ><Check class="size-3.5" /></span>
        </span>
        <Avatar
          :src="agent.company_logo ?? agent.avatar"
          :name="agent.display_name"
          class="car__logo"
        />
        <span class="car__id">
          <span class="car__name">{{ agent.display_name }}</span>
          <span class="car__meta">{{ [service(agent), locale.t.clientHome.jobs.replace('{count}', String(agent.completed_orders_count))].filter(Boolean).join(' · ') }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.car__head { display: flex; align-items: center; margin-bottom: 10px; }
.car__title { flex: 1; margin: 0; font-size: 18px; font-weight: 600; }
.car__all { min-height: 44px; border: 0; background: none; color: var(--primary); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.car__rail { display: flex; gap: 8px; margin-right: -16px; padding-right: 16px; overflow-x: auto; scrollbar-width: none; }
.car__rail::-webkit-scrollbar { display: none; }
.car__card {
  display: flex; flex: 0 0 150px; height: 196px; flex-direction: column; justify-content: space-between; padding: 12px;
  border: 0; border-radius: 22px; color: #fff; font-family: inherit; text-align: left; cursor: pointer;
}
.car__card:focus-visible, .car__all:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.car__top { display: flex; align-items: center; justify-content: space-between; }
.car__pill { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 9px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: #101828; font-size: 12px; font-weight: 700; }
.car__seal { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: #0b6bcb; }
.car__logo { align-self: center; width: 60px; height: 60px; border-radius: 18px; border: 2px solid rgba(255, 255, 255, 0.5); }
.car__id { display: flex; flex-direction: column; gap: 2px; }
.car__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 700; }
.car__meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; opacity: 0.88; }
</style>
