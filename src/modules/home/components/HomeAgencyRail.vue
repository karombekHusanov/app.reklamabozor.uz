<script setup lang="ts">
import { Check, Star } from '@lucide/vue'
import { useRouter } from 'vue-router'
import Avatar from '@/core/ui/Avatar.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { categoryName } from '@/core/i18n/category-name'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { PublicAgent } from '@/modules/marketplace/services/agents.service'

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
  return value !== null ? value.toFixed(1) : null
}

function chips(agent: PublicAgent): string[] {
  return agent.categories.slice(0, 2).map(c => categoryName(c, locale.locale))
}

function openAgent(id: number) {
  router.push(`/agents/${id}`)
}
</script>

<template>
  <div v-if="loading || agents.length">
    <div class="sec-head">
      <h2 class="sec-title">
        {{ title }}
      </h2>
      <button
        type="button"
        class="sec-link"
        @click="router.push(viewAllRoute)"
      >
        {{ locale.t.home.viewAllAgents }} →
      </button>
    </div>

    <div
      v-if="loading"
      class="arail"
    >
      <div
        v-for="n in 2"
        :key="n"
        class="acard"
      >
        <div class="acard__head">
          <Skeleton class="size-[54px] rounded-2xl" />
          <div class="min-w-0 flex-1">
            <Skeleton class="h-4 w-28 rounded-md" />
            <Skeleton class="mt-2 h-3 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton class="h-8 w-full rounded-md" />
      </div>
    </div>

    <div
      v-else
      class="arail"
    >
      <article
        v-for="agent in agents"
        :key="agent.id"
        class="acard"
        role="button"
        tabindex="0"
        @click="openAgent(agent.id)"
        @keydown.enter="openAgent(agent.id)"
      >
        <div class="acard__head">
          <div class="acard__ava">
            <Avatar
              :src="agent.company_logo ?? agent.avatar"
              :name="agent.display_name"
              size="md"
              class="size-[54px] rounded-2xl"
            />
            <span
              class="acard__seal"
              :title="locale.t.home.verifiedLabel"
            >
              <Check class="size-3" />
            </span>
          </div>
          <div class="acard__id">
            <p class="acard__name">
              {{ agent.display_name }}
            </p>
            <div class="acard__sub">
              <span
                v-if="ratingText(agent)"
                class="acard__rating"
              >
                <Star class="size-[13px]" />{{ ratingText(agent) }}
              </span>
              <span
                v-if="ratingText(agent)"
                class="sep"
              >·</span>
              <span>{{ locale.t.home.jobsCount.replace('{count}', String(agent.completed_orders_count)) }}</span>
            </div>
          </div>
        </div>

        <p
          v-if="agent.bio"
          class="acard__desc"
        >
          {{ agent.bio }}
        </p>

        <div class="chips">
          <span class="chip chip--vf"><Check class="size-[11px]" />{{ locale.t.home.verifiedLabel }}</span>
          <span
            v-for="(chip, i) in chips(agent)"
            :key="i"
            class="chip"
          >{{ chip }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 13px; padding-inline: var(--home-gutter, 18px); }
.sec-title { font-family: var(--rb-font-display); font-weight: 800; font-size: 18px; letter-spacing: -0.015em; margin: 0; color: var(--foreground); }
.sec-link { font-size: 12.5px; font-weight: 700; color: var(--primary); background: none; border: 0; cursor: pointer; padding: 0; white-space: nowrap; -webkit-tap-highlight-color: transparent; }

.arail {
  display: flex; gap: 13px; overflow-x: auto;
  padding: 2px var(--home-gutter, 18px) 6px;
  /* without this the snap point ignores the gutter and eats the left padding */
  scroll-padding-inline: var(--home-gutter, 18px);
  scroll-snap-type: x mandatory; scrollbar-width: none;
}
.arail::-webkit-scrollbar { display: none; }
.acard {
  scroll-snap-align: start; flex: 0 0 80%;
  background: var(--card); border: 1px solid var(--border); border-radius: 20px;
  padding: 15px; box-shadow: var(--rb-elev-1); cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
  transition: transform var(--rb-dur) var(--rb-ease), border-color var(--rb-dur) var(--rb-ease);
}
.acard:hover { transform: translateY(-2px); border-color: var(--primary); }
.acard:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.acard__head { display: flex; align-items: center; gap: 12px; }
.acard__ava { position: relative; width: 54px; height: 54px; flex-shrink: 0; }
.acard__seal {
  position: absolute; right: -5px; bottom: -5px; width: 22px; height: 22px;
  border-radius: 999px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(150deg, var(--rb-glow), #0b6bcb);
  border: 2.5px solid var(--card); box-shadow: 0 2px 6px rgba(2, 48, 92, 0.4);
}
.acard__id { flex: 1; min-width: 0; }
.acard__name { font-family: var(--rb-font-display); font-weight: 800; font-size: 16px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; color: var(--foreground); }
.acard__sub { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12.5px; color: var(--muted-foreground); }
.acard__rating { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; color: var(--foreground); font-variant-numeric: tabular-nums; }
.acard__rating :deep(svg) { color: var(--rb-rating); fill: var(--rb-rating); }
.acard__sub .sep { opacity: 0.5; }
.acard__desc { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--muted-foreground); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; min-height: 36px; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { font-size: 10.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--secondary); color: var(--secondary-foreground); display: inline-flex; align-items: center; gap: 3px; }
.chip--vf { background: color-mix(in srgb, var(--success) 15%, var(--card)); color: var(--success); }
</style>
