<script setup lang="ts">
import { BadgeCheck, ChevronDown, MessageCircle, Phone, ShieldCheck, Star } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Drawer from '@/core/ui/Drawer.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { categoryName } from '@/core/i18n/category-name'
import { formatDate, localizedDayjs } from '@/core/lib/date'
import { fetchPublicAgent, type PublicAgent } from '@/modules/marketplace/services/agents.service'

/**
 * Profi-style provider profile as a bottom sheet — opened from the order
 * chat so the client can size up the agency without leaving the thread.
 */
const props = defineProps<{
  profileId: number | null
  /** Shown when the thread already exposes the agency's phone. */
  phone?: string | null
  /** "Sent you an offer" eyebrow on the order thread. */
  sentOffer?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ write: [] }>()

const locale = useLocaleStore()
const router = useRouter()

const agent = ref<PublicAgent | null>(null)
const loading = ref(false)
const failed = ref(false)
const showAllReviews = ref(false)
let loadedId: number | null = null

async function load() {
  if (props.profileId == null || loadedId === props.profileId) return
  loading.value = true
  failed.value = false
  try {
    agent.value = await fetchPublicAgent(props.profileId)
    loadedId = props.profileId
  }
  catch {
    failed.value = true
  }
  finally {
    loading.value = false
  }
}

watch(open, (value) => { if (value) void load() })

const t = computed(() => locale.t.orderView)
const name = computed(() => agent.value?.display_name || agent.value?.company_name || '')
const photo = computed(() => agent.value?.company_logo || agent.value?.avatar || null)
const starsCount = computed(() => agent.value?.stars_count ?? 0)
const stars = computed(() => {
  const s = agent.value?.stars
  return starsCount.value > 0 && s != null ? Number(s).toFixed(1) : null
})
const reviews = computed(() => agent.value?.reviews ?? [])
const visibleReviews = computed(() => (showAllReviews.value ? reviews.value : reviews.value.slice(0, 3)))
const since = computed(() => {
  const at = agent.value?.member_since
  return at ? localizedDayjs(locale.locale, at).format('MMMM YYYY') : null
})
const telHref = computed(() => (props.phone ? `tel:${props.phone.replace(/[^\d+]/g, '')}` : null))

function write() {
  open.value = false
  emit('write')
}

function openFullProfile() {
  if (props.profileId == null) return
  open.value = false
  void router.push(`/agents/${props.profileId}`)
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="name || t.pShowProfile"
    hide-title
  >
    <div class="aps">
      <template v-if="loading && !agent">
        <Skeleton class="mx-auto h-40 w-32 rounded-3xl" />
        <Skeleton class="h-20 w-full rounded-2xl" />
        <Skeleton class="h-12 w-full rounded-2xl" />
      </template>

      <p
        v-else-if="failed || !agent"
        class="py-10 text-center text-sm text-muted-foreground"
      >
        {{ t.pLoadError }}
      </p>

      <template v-else>
        <p
          v-if="sentOffer"
          class="aps__eyebrow"
        >
          <MessageCircle
            class="size-4"
            aria-hidden="true"
          />
          {{ t.pSentOffer }}
        </p>

        <div class="aps__hero">
          <span class="aps__photo">
            <img
              v-if="photo"
              :src="photo"
              :alt="name"
            >
            <span
              v-else
              class="aps__initials"
            >{{ name.slice(0, 2).toUpperCase() }}</span>
          </span>
          <p class="aps__name">
            {{ name }}
            <BadgeCheck
              class="aps__verified"
              aria-hidden="true"
            />
          </p>
          <p
            v-if="agent.location_label"
            class="aps__sub"
          >
            {{ agent.location_label }}
          </p>
        </div>

        <div class="aps__stats">
          <div class="aps__stat">
            <ShieldCheck
              class="aps__stat-ic aps__stat-ic--ok"
              aria-hidden="true"
            />
            <span class="aps__stat-l">{{ t.pVerified }}</span>
          </div>
          <div class="aps__stat">
            <span class="aps__stat-v">
              <Star
                class="aps__star"
                aria-hidden="true"
              />
              {{ stars ?? '—' }}
            </span>
            <span class="aps__stat-l">{{ t.pRating }}</span>
          </div>
          <div class="aps__stat">
            <span class="aps__stat-v">{{ starsCount }}</span>
            <span class="aps__stat-l">{{ t.pReviews }}</span>
          </div>
        </div>

        <div class="aps__actions">
          <button
            type="button"
            class="aps__btn aps__btn--primary"
            @click="write"
          >
            <MessageCircle
              class="size-5"
              aria-hidden="true"
            />
            {{ t.pWrite }}
          </button>
          <a
            v-if="telHref"
            :href="telHref"
            class="aps__btn"
          >
            <Phone
              class="size-5"
              aria-hidden="true"
            />
            {{ t.pCall }}
          </a>
        </div>

        <section
          v-if="agent.bio"
          class="aps__sec"
        >
          <h3>{{ t.pAbout }}</h3>
          <p class="aps__text">
            {{ agent.bio }}
          </p>
        </section>

        <section
          v-if="agent.categories.length"
          class="aps__sec"
        >
          <h3>{{ t.pServices }}</h3>
          <div
            v-for="category in agent.categories"
            :key="category.id"
            class="aps__svc"
          >
            <span class="aps__svc-n">{{ categoryName(category, locale.locale) }}</span>
            <span class="aps__svc-p">{{ t.pByAgreement }}</span>
          </div>
        </section>

        <section
          v-if="since || agent.completed_orders_count"
          class="aps__sec"
        >
          <h3>{{ t.pExperience }}</h3>
          <p
            v-if="since"
            class="aps__text"
          >
            {{ t.pSince.replace('{date}', since) }}
          </p>
          <p
            v-if="agent.completed_orders_count"
            class="aps__text"
          >
            {{ t.pCompleted.replace('{count}', String(agent.completed_orders_count)) }}
          </p>
        </section>

        <section class="aps__sec">
          <h3>{{ stars ? t.pRatingTitle.replace('{value}', stars) : t.pRating }}</h3>
          <p
            v-if="reviews.length === 0"
            class="aps__text"
          >
            {{ t.pNoReviews }}
          </p>
          <article
            v-for="review in visibleReviews"
            :key="review.id"
            class="aps__review"
          >
            <p class="aps__review-who">
              {{ review.client_name }}
            </p>
            <p class="aps__review-date">
              {{ formatDate(review.created_at) }}
              <span class="aps__review-stars">
                <Star
                  class="aps__star"
                  aria-hidden="true"
                />
                {{ Number(review.rating).toFixed(1) }}
              </span>
            </p>
            <p
              v-if="review.comment"
              class="aps__text"
            >
              {{ review.comment }}
            </p>
          </article>
          <button
            v-if="reviews.length > 3 && !showAllReviews"
            type="button"
            class="aps__more"
            @click="showAllReviews = true"
          >
            {{ t.pAllReviews.replace('{count}', String(reviews.length)) }}
            <ChevronDown
              class="size-4"
              aria-hidden="true"
            />
          </button>
        </section>

        <button
          type="button"
          class="aps__full"
          @click="openFullProfile"
        >
          {{ t.pFullProfile }}
        </button>
      </template>
    </div>
  </Drawer>
</template>

<style scoped>
.aps { display: flex; flex-direction: column; gap: 14px; padding: 0 4px 4px; }
.aps__eyebrow { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 13px; color: var(--muted-foreground); }

.aps__hero { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.aps__photo {
  display: grid;
  place-items: center;
  width: 128px;
  height: 160px;
  overflow: hidden;
  border-radius: 24px;
  background: var(--secondary);
}
.aps__photo img { width: 100%; height: 100%; object-fit: cover; }
.aps__initials { font-family: var(--rb-font-display); font-size: 36px; font-weight: 800; color: var(--muted-foreground); }
.aps__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  font-family: var(--rb-font-display);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--foreground);
}
.aps__verified { width: 20px; height: 20px; flex-shrink: 0; color: var(--rb-glow); }
.aps__sub { margin: 0; font-size: 13px; color: var(--muted-foreground); }

.aps__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.aps__stat {
  display: flex;
  min-height: 84px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: var(--rb-r-tile);
  background: var(--secondary);
  text-align: center;
}
.aps__stat-v { display: inline-flex; align-items: center; gap: 4px; font-size: 20px; font-weight: 800; color: var(--foreground); }
.aps__stat-l { font-size: 12px; line-height: 1.25; color: var(--muted-foreground); }
.aps__stat-ic { width: 24px; height: 24px; }
.aps__stat-ic--ok { color: var(--success); }
.aps__star { width: 16px; height: 16px; fill: var(--rb-rating); color: var(--rb-rating); }

.aps__actions { display: flex; gap: 8px; }
.aps__btn {
  display: inline-flex;
  min-height: 52px;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--rb-r-field);
  background: var(--secondary);
  color: var(--foreground);
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}
.aps__btn--primary { background: var(--rb-cta); color: #fff; }
.aps__btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }

.aps__sec { display: flex; flex-direction: column; gap: 8px; padding-top: 14px; border-top: 1px solid var(--border); }
.aps__sec h3 { margin: 0; font-family: var(--rb-font-display); font-size: 18px; font-weight: 800; color: var(--foreground); }
.aps__text { margin: 0; font-size: 14px; line-height: 1.5; color: var(--foreground); white-space: pre-line; }

.aps__svc { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 6px 0; }
.aps__svc-n { font-size: 14.5px; font-weight: 700; color: var(--foreground); }
.aps__svc-p { flex-shrink: 0; font-size: 13px; color: var(--muted-foreground); }

.aps__review { display: flex; flex-direction: column; gap: 4px; padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--border) 65%, transparent); }
.aps__review:last-of-type { border-bottom: 0; }
.aps__review-who { margin: 0; font-size: 14.5px; font-weight: 800; color: var(--foreground); }
.aps__review-date { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 12px; color: var(--muted-foreground); }
.aps__review-stars { display: inline-flex; align-items: center; gap: 3px; font-weight: 700; color: var(--foreground); }

.aps__more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--muted-foreground);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}
.aps__full {
  min-height: 48px;
  border: 1px solid var(--border);
  border-radius: var(--rb-r-field);
  background: var(--card);
  color: var(--primary);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}
</style>
