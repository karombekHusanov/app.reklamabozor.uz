<script setup lang="ts">
import { BadgeCheck, MapPin, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Each agency as a business card (visitka): real card proportions, a quiet
 * paper surface with the name's first letter embossed as a watermark, logo +
 * verified seal, the name set large with its tagline, and the card's "contact
 * line" — services · location — under a hairline. Swipe through; tap opens
 * the agency. Every agency listed here is verified, so the seal says it once.
 */
defineProps<{
  title: string
  agents: PublicAgent[]
  viewAllRoute: string
  loading: boolean
}>()

const locale = useLocaleStore()
const router = useRouter()

function ratingText(agent: PublicAgent): string | null {
  const value = agent.stars ?? agent.rating_avg
  return value !== null && (agent.stars_count || agent.rating_count) ? value.toFixed(1) : null
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

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div v-if="loading || agents.length">
    <div class="vk-head">
      <div>
        <span class="rb-eyebrow">{{ locale.t.landing.agenciesEyebrow }}</span>
        <h2 class="rb-sec__title vk-head__title">
          {{ title }}
        </h2>
      </div>
      <button
        type="button"
        class="rb-sec__link"
        @click="router.push(viewAllRoute)"
      >
        {{ locale.t.home.viewAllAgents }} →
      </button>
    </div>

    <div
      v-if="loading"
      class="vk-rail"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="vk"
      >
        <Skeleton class="size-11 rounded-xl" />
        <div class="mt-auto space-y-2">
          <Skeleton class="h-5 w-36 rounded-md" />
          <Skeleton class="h-3 w-44 rounded-md" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="vk-rail"
    >
      <article
        v-for="agent in agents"
        :key="agent.id"
        class="vk"
        role="button"
        tabindex="0"
        :aria-label="agent.display_name"
        @click="openAgent(agent.id)"
        @keydown.enter="openAgent(agent.id)"
      >
        <span
          class="vk__mark"
          aria-hidden="true"
        >{{ monogram(agent) }}</span>

        <div class="vk__top">
          <div class="vk__logo">
            <Avatar
              :src="agent.company_logo ?? agent.avatar"
              :name="agent.display_name"
              size="md"
              class="size-11 rounded-xl"
            />
            <span
              class="vk__seal"
              :title="locale.t.home.verifiedLabel"
            ><BadgeCheck class="size-3.5" /></span>
          </div>

          <span
            v-if="ratingText(agent)"
            class="vk__rating"
          ><Star class="size-3.5" />{{ ratingText(agent) }}</span>
          <span
            v-else
            class="vk__new"
          >{{ locale.t.landing.agenciesNew }}</span>
        </div>

        <div class="vk__id">
          <p class="vk__name">
            {{ agent.display_name }}
          </p>
          <p
            v-if="agent.bio"
            class="vk__tag"
          >
            {{ agent.bio }}
          </p>
        </div>

        <div class="vk__foot">
          <span class="vk__svc">{{ services(agent) }}</span>
          <span
            v-if="city(agent.location_label)"
            class="vk__meta"
          ><MapPin class="size-3 shrink-0" /><span class="truncate">{{ city(agent.location_label) }}</span></span>
          <span
            v-else
            class="vk__meta"
          >{{ locale.t.home.jobsCount.replace('{count}', String(agent.completed_orders_count)) }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.vk-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 13px; padding-inline: var(--home-gutter, 18px); }
.vk-head__title { margin-top: 3px; }

.vk-rail {
  display: flex; gap: 12px; overflow-x: auto;
  padding: 4px var(--home-gutter, 18px) 10px;
  /* without this the snap point ignores the gutter and eats the left padding */
  scroll-padding-inline: var(--home-gutter, 18px);
  scroll-snap-type: x mandatory; scrollbar-width: none;
}
.vk-rail::-webkit-scrollbar { display: none; }

/* The card itself — business-card proportions, paper surface, brand edge. */
.vk {
  position: relative; overflow: hidden; scroll-snap-align: start; flex: 0 0 82%; max-width: 330px;
  aspect-ratio: 1.6 / 1; display: flex; flex-direction: column; padding: 16px 16px 14px 19px;
  border: 1px solid var(--border); border-radius: 16px; cursor: pointer;
  background: linear-gradient(135deg, var(--card) 0%, var(--card) 55%, color-mix(in srgb, var(--primary) 5%, var(--card)) 100%);
  box-shadow: var(--rb-elev-1), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
  transition: transform var(--rb-dur) var(--rb-ease), box-shadow var(--rb-dur) var(--rb-ease);
}
.vk::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, var(--rb-glow), var(--primary));
}
.vk:active { transform: scale(0.985); }
.vk:hover { transform: translateY(-2px); box-shadow: var(--rb-elev-2); }
.vk:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* Embossed monogram — the brand letter pressed faintly into the paper. */
.vk__mark {
  position: absolute; right: -6px; bottom: -34px; pointer-events: none; user-select: none;
  font-family: var(--rb-font-display); font-size: 150px; font-weight: 900; line-height: 1;
  color: color-mix(in srgb, var(--primary) 7%, transparent);
}

.vk__top { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
.vk__logo { position: relative; flex-shrink: 0; }
.vk__logo :deep(img), .vk__logo > :first-child { border: 1px solid var(--border); }
.vk__seal {
  position: absolute; right: -6px; bottom: -6px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 999px;
  color: #fff; background: linear-gradient(150deg, var(--rb-glow), var(--primary)); border: 2px solid var(--card);
}
.vk__rating {
  display: inline-flex; align-items: center; gap: 3px; font-size: 12.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--foreground);
}
.vk__rating :deep(svg) { color: var(--rb-rating); fill: var(--rb-rating); }
.vk__new {
  padding: 3px 8px; border-radius: var(--rb-r-chip); background: var(--secondary); color: var(--secondary-foreground);
  font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
}

.vk__id { position: relative; margin-top: auto; }
.vk__name {
  margin: 0; font-family: var(--rb-font-display); font-size: 20px; font-weight: 900; line-height: 1.1; letter-spacing: -0.02em; color: var(--foreground);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.vk__tag { margin: 3px 0 0; font-size: 12.5px; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.vk__foot {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border);
  font-size: 11px; font-weight: 600; color: var(--muted-foreground);
}
.vk__svc { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: 0.02em; }
.vk__meta { display: inline-flex; flex-shrink: 0; align-items: center; gap: 3px; max-width: 45%; white-space: nowrap; }
</style>
