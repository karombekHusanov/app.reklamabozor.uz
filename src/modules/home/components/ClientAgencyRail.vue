<script setup lang="ts">
import { BadgeCheck, MapPin, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { ROUTES } from '@/modules/shell/constants/routes'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Top agencies as business cards (the old home's "visitka"): paper surface with
 * a brand edge and the name's first letter embossed, logo + verified seal,
 * rating or "New", name + tagline, and a services · city line under a hairline.
 * Sized and shaded for the new home (rounded, shadow instead of a border).
 */
defineProps<{ agents: PublicAgent[] }>()

const locale = useLocaleStore()
const router = useRouter()

function ratingText(agent: PublicAgent): string | null {
  const value = agent.stars ?? agent.rating_avg
  return value !== null && value !== undefined && (agent.stars_count || agent.rating_count) ? value.toFixed(1) : null
}

function services(agent: PublicAgent): string {
  return agent.categories.slice(0, 2).map(c => categoryName(c, locale.locale)).join(' · ')
}

const COUNTRY = /^(o[ʻ'‘`]?zbekiston|uzbekistan|узбекистан|ўзбекистон)$/i

/** A card only needs the city: last address part that isn't a postcode or the country. */
function city(label: string | null): string | null {
  if (!label) return null
  const parts = label.split(',').map(p => p.trim()).filter(p => p && !/^\d+$/.test(p) && !COUNTRY.test(p))
  return parts.at(-1) ?? null
}

function monogram(agent: PublicAgent): string {
  return (agent.display_name.trim()[0] ?? '').toUpperCase()
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
        v-for="agent in agents"
        :key="agent.id"
        type="button"
        class="vk"
        :aria-label="agent.display_name"
        @click="router.push(`/agents/${agent.id}`)"
      >
        <span
          class="vk__mark"
          aria-hidden="true"
        >{{ monogram(agent) }}</span>

        <span class="vk__top">
          <span class="vk__logo">
            <Avatar
              :src="agent.company_logo ?? agent.avatar"
              :name="agent.display_name"
              size="md"
              class="size-11 rounded-xl"
            />
            <span
              class="vk__seal"
              :title="locale.t.clientHome.verified"
            ><BadgeCheck class="size-3.5" /></span>
          </span>
          <span
            v-if="ratingText(agent)"
            class="vk__rating"
          ><Star class="size-3.5" />{{ ratingText(agent) }}</span>
          <span
            v-else
            class="vk__new"
          >{{ locale.t.clientHome.new }}</span>
        </span>

        <span class="vk__id">
          <span class="vk__name">{{ agent.display_name }}</span>
          <span
            v-if="agent.bio"
            class="vk__tag"
          >{{ agent.bio }}</span>
        </span>

        <span class="vk__foot">
          <span class="vk__svc">{{ services(agent) }}</span>
          <span
            v-if="city(agent.location_label)"
            class="vk__meta"
          ><MapPin class="size-3 shrink-0" /><span class="truncate">{{ city(agent.location_label) }}</span></span>
          <span
            v-else
            class="vk__meta"
          >{{ locale.t.clientHome.jobs.replace('{count}', String(agent.completed_orders_count)) }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.car__head { display: flex; align-items: center; margin-bottom: 10px; }
.car__title { flex: 1; margin: 0; font-size: 18px; font-weight: 600; }
.car__all { min-height: 44px; border: 0; background: none; color: var(--primary); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.car__all:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
/* Bleeds to the right edge; room top/bottom so the card shadow isn't clipped. */
.car__rail {
  display: flex; gap: 10px; margin: -4px -16px -12px 0; padding: 4px 16px 12px 0;
  overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
}
.car__rail::-webkit-scrollbar { display: none; }

/* Business card: paper surface, brand edge on the left. */
.vk {
  position: relative; overflow: hidden; scroll-snap-align: start; flex: 0 0 82%; max-width: 330px;
  aspect-ratio: 1.6 / 1; display: flex; flex-direction: column; padding: 16px 16px 14px 19px;
  border: 0; border-radius: 22px; font-family: inherit; text-align: left; color: var(--foreground); cursor: pointer;
  background: linear-gradient(135deg, var(--card) 0%, var(--card) 55%, color-mix(in srgb, var(--primary) 5%, var(--card)) 100%);
  box-shadow: var(--rb-elev-1);
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--rb-dur) var(--rb-ease);
}
.vk::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, var(--rb-glow), var(--primary));
}
.vk:active { transform: scale(0.985); }
.vk:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* Embossed monogram — the brand letter pressed faintly into the paper. */
.vk__mark {
  position: absolute; right: -6px; bottom: -34px; pointer-events: none; user-select: none;
  font-family: var(--rb-font-display); font-size: 150px; font-weight: 900; line-height: 1;
  color: color-mix(in srgb, var(--primary) 7%, transparent);
}

.vk__top { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
.vk__logo { position: relative; flex-shrink: 0; }
.vk__logo > :first-child { border: 1px solid var(--border); }
.vk__seal {
  position: absolute; right: -6px; bottom: -6px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 999px;
  color: #fff; background: linear-gradient(150deg, var(--rb-glow), var(--primary)); border: 2px solid var(--card);
}
.vk__rating {
  display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 999px; background: var(--secondary);
  font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--foreground);
}
.vk__rating :deep(svg) { color: var(--rb-rating); fill: var(--rb-rating); }
.vk__new {
  padding: 3px 9px; border-radius: 999px; background: var(--secondary); color: var(--secondary-foreground);
  font-size: 11px; font-weight: 700;
}

.vk__id { position: relative; display: flex; flex-direction: column; margin-top: auto; }
.vk__name {
  font-size: 19px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vk__tag { margin-top: 3px; font-size: 12.5px; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.vk__foot {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);
  font-size: 11.5px; font-weight: 600; color: var(--muted-foreground);
}
.vk__svc { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vk__meta { display: inline-flex; flex-shrink: 0; align-items: center; gap: 3px; max-width: 45%; white-space: nowrap; }
</style>
