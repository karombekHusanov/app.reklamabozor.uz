<script setup lang="ts">
import { Info, Loader2, MapPin } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import Avatar from '@/core/ui/Avatar.vue'
import ImageUpload from '@/core/ui/ImageUpload.vue'
import LocationPicker from '@/core/ui/LocationPicker.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { useToast } from '@/core/composables/useToast'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { fetchAdvantagesCatalog } from '@/modules/agent/services/agent.service'
import type { Advantage, AgentDetailsPayload, WorkflowStep } from '@/modules/agent/types/agent'
import AdvantagesPicker from '@/modules/profile/components/edit/AdvantagesPicker.vue'
import AgentVerificationReadOnly from '@/modules/profile/components/edit/AgentVerificationReadOnly.vue'
import CategoryCheckboxList from '@/modules/profile/components/edit/CategoryCheckboxList.vue'
import PortfolioManager from '@/modules/profile/components/edit/PortfolioManager.vue'
import ProfileFormField from '@/modules/profile/components/edit/ProfileFormField.vue'
import WorkflowStepsEditor from '@/modules/profile/components/edit/WorkflowStepsEditor.vue'
import { isEditSection, type EditSection } from '@/modules/profile/lib/edit-sections'
import { ROUTES } from '@/modules/shell/constants/routes'

/**
 * One executor-profile section on its own page: a short "why it matters" note,
 * the editor, and a docked Cancel / Save bar. Saves only this section's fields
 * (`PATCH /agent/profile` is partial). Portfolio saves per item; requisites are
 * read-only — neither shows the save bar.
 */
const BIO_MAX = 2000
const RESULTS_MAX = 2000

const route = useRoute()
const router = useRouter()
const agent = useAgentStore()
const locale = useLocaleStore()
const toast = useToast()

const t = computed(() => locale.t.profileEdit)

const section = computed<EditSection | null>(() => {
  const value = route.params.section
  return isEditSection(value) ? value : null
})

const profile = computed(() => agent.profile)

const titles = computed<Record<EditSection, { title: string, why: string }>>(() => ({
  brand: { title: t.value.brand, why: t.value.whyBrand },
  categories: { title: t.value.categories, why: t.value.whyCategories },
  location: { title: t.value.location, why: t.value.whyLocation },
  portfolio: { title: t.value.portfolio, why: t.value.whyPortfolio },
  results: { title: t.value.results, why: t.value.whyResults },
  advantages: { title: t.value.advantages, why: t.value.whyAdvantages },
  workflow: { title: t.value.workflow, why: t.value.whyWorkflow },
  requisites: { title: t.value.requisites, why: t.value.whyRequisites },
}))

const meta = computed(() => (section.value ? titles.value[section.value] : null))
const hasSaveBar = computed(() =>
  section.value !== null && section.value !== 'portfolio' && section.value !== 'requisites',
)

// ── Form state (seeded once the profile is loaded) ───────────────────────────
const form = reactive({
  company_logo_file_id: null as number | null,
  bio: '',
  website_url: '',
  linkedin_url: '',
  location_label: '',
  lat: null as number | null,
  lng: null as number | null,
  results_text: '',
})
const categoryIds = ref<number[]>([])
const advantageIds = ref<number[]>([])
const workflowSteps = ref<WorkflowStep[]>([])
const advantagesCatalog = ref<Advantage[]>([])
const seeded = ref(false)

watch(profile, (p) => {
  if (!p || seeded.value) return
  form.company_logo_file_id = p.company_logo_file_id
  form.bio = p.bio ?? ''
  form.website_url = p.website_url ?? ''
  form.linkedin_url = p.linkedin_url ?? ''
  form.location_label = p.location_label ?? ''
  form.lat = p.lat != null && p.lat !== '' ? Number(p.lat) : null
  form.lng = p.lng != null && p.lng !== '' ? Number(p.lng) : null
  form.results_text = p.results_text ?? ''
  categoryIds.value = p.categories.map(c => c.id)
  advantageIds.value = (p.advantages ?? []).map(a => a.id)
  workflowSteps.value = (p.workflow_steps ?? []).map(step => ({ ...step }))
  seeded.value = true
}, { immediate: true })

onMounted(async () => {
  await agent.loadProfile()
  // Only an approved executor edits the public profile — everyone else goes
  // back to the application / status flow.
  if (agent.profile?.status !== 'approved' || !section.value) {
    void router.replace(ROUTES.profileEdit)
    return
  }
  if (section.value === 'categories') void agent.loadCategories()
  if (section.value === 'advantages') {
    try {
      advantagesCatalog.value = await fetchAdvantagesCatalog()
    }
    catch {
      advantagesCatalog.value = []
    }
  }
})

function onLocationPicked(value: { lat: number, lng: number, address: string | null }) {
  form.lat = value.lat
  form.lng = value.lng
  if (value.address && form.location_label.trim() === '') {
    form.location_label = value.address
  }
}

function payload(): AgentDetailsPayload {
  switch (section.value) {
    case 'brand':
      return { company_logo_file_id: form.company_logo_file_id, bio: form.bio.trim() || null }
    case 'categories':
      return { category_ids: [...categoryIds.value] }
    case 'location':
      return {
        lat: form.lat,
        lng: form.lng,
        location_label: form.location_label.trim() || null,
        website_url: form.website_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
      }
    case 'results':
      return { results_text: form.results_text.trim() || null }
    case 'advantages':
      return { advantage_ids: [...advantageIds.value] }
    case 'workflow':
      return {
        workflow_steps: workflowSteps.value
          .map(step => ({ title: step.title.trim(), description: step.description?.trim() || null }))
          .filter(step => step.title !== ''),
      }
    default:
      return {}
  }
}

function backToHub() {
  void router.replace(ROUTES.profileEdit)
}

async function save() {
  const ok = await agent.submitDetails(payload())
  if (ok) {
    toast.success(t.value.savedToast)
    backToHub()
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}

const bioPreview = computed(() => form.bio.trim() || t.value.brandEmpty)
</script>

<template>
  <div class="pb-6">
    <AppHeader
      :title="meta?.title ?? t.hubTitle"
      :subtitle="t.hubTitle"
      show-back
    />

    <section class="px-4">
      <div
        v-if="!profile || !seeded || !section"
        class="space-y-4"
      >
        <Skeleton class="h-16" />
        <Skeleton class="h-64" />
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="save"
      >
        <div class="pes-why">
          <Info
            class="size-[18px] shrink-0"
            aria-hidden="true"
          />
          <p>{{ meta?.why }}</p>
        </div>

        <!-- Brand -->
        <template v-if="section === 'brand'">
          <section class="pes-card">
            <ProfileFormField
              :label="locale.t.agent.companyLogo"
              :hint="locale.t.agent.logoHint"
            >
              <ImageUpload
                v-model="form.company_logo_file_id"
                :preview-url="profile.company_logo"
              />
            </ProfileFormField>
            <ProfileFormField
              :label="locale.t.agent.aboutCompany"
              html-for="pes-bio"
            >
              <textarea
                id="pes-bio"
                v-model="form.bio"
                :maxlength="BIO_MAX"
                :placeholder="locale.t.agent.aboutPlaceholder"
                class="glass-input profile-form-textarea profile-form-textarea--lg"
              />
              <span class="pes-count">{{ t.charCount.replace('{count}', String(form.bio.length)).replace('{max}', String(BIO_MAX)) }}</span>
            </ProfileFormField>
          </section>

          <div>
            <h2 class="pes-label">
              {{ t.preview }}
            </h2>
            <div class="pes-preview">
              <Avatar
                :src="profile.company_logo"
                :name="profile.company_name || profile.display_name"
                size="md"
              />
              <div class="min-w-0 space-y-1">
                <p class="pes-preview__name">
                  {{ profile.company_name || profile.display_name }}
                </p>
                <p class="pes-preview__bio">
                  {{ bioPreview }}
                </p>
                <p
                  v-if="profile.location_label"
                  class="pes-preview__meta"
                >
                  <MapPin
                    class="size-3 text-primary"
                    aria-hidden="true"
                  />
                  {{ profile.location_label }}
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- Categories -->
        <section
          v-else-if="section === 'categories'"
          class="pes-card"
        >
          <Skeleton
            v-if="agent.categories.length === 0"
            class="h-48"
          />
          <CategoryCheckboxList
            v-else
            v-model="categoryIds"
            :categories="agent.categories"
          />
        </section>

        <!-- Location & links -->
        <template v-else-if="section === 'location'">
          <section class="pes-card">
            <ProfileFormField
              :label="locale.t.agent.location"
              html-for="pes-location"
            >
              <LocationPicker
                :lat="form.lat"
                :lng="form.lng"
                @change="onLocationPicked"
              />
              <input
                id="pes-location"
                v-model="form.location_label"
                type="text"
                :placeholder="locale.t.agent.locationPlaceholder"
                class="glass-input profile-form-input"
              >
            </ProfileFormField>
          </section>
          <section class="pes-card">
            <ProfileFormField
              :label="locale.t.agent.website"
              html-for="pes-website"
            >
              <input
                id="pes-website"
                v-model="form.website_url"
                type="url"
                inputmode="url"
                placeholder="https://example.uz"
                class="glass-input profile-form-input"
              >
            </ProfileFormField>
            <ProfileFormField
              :label="locale.t.agent.linkedin"
              html-for="pes-linkedin"
            >
              <input
                id="pes-linkedin"
                v-model="form.linkedin_url"
                type="url"
                inputmode="url"
                placeholder="https://linkedin.com/company/…"
                class="glass-input profile-form-input"
              >
            </ProfileFormField>
          </section>
        </template>

        <!-- Portfolio (saves per item) -->
        <section
          v-else-if="section === 'portfolio'"
          class="pes-card"
        >
          <PortfolioManager embedded />
        </section>

        <!-- Results -->
        <section
          v-else-if="section === 'results'"
          class="pes-card"
        >
          <ProfileFormField
            :label="locale.t.agent.resultsHighlights"
            html-for="pes-results"
          >
            <textarea
              id="pes-results"
              v-model="form.results_text"
              :maxlength="RESULTS_MAX"
              :placeholder="locale.t.agent.resultsPlaceholder"
              class="glass-input profile-form-textarea profile-form-textarea--lg"
            />
            <span class="pes-count">{{ t.charCount.replace('{count}', String(form.results_text.length)).replace('{max}', String(RESULTS_MAX)) }}</span>
          </ProfileFormField>
          <p class="pes-hint">
            {{ t.resultsExample }}
          </p>
        </section>

        <!-- Advantages -->
        <section
          v-else-if="section === 'advantages'"
          class="pes-card"
        >
          <AdvantagesPicker
            v-if="advantagesCatalog.length > 0"
            v-model="advantageIds"
            :catalog="advantagesCatalog"
            embedded
          />
          <p
            v-else
            class="pes-hint"
          >
            {{ locale.t.agent.noAdvantagesCatalog }}
          </p>
        </section>

        <!-- Workflow -->
        <section
          v-else-if="section === 'workflow'"
          class="pes-card"
        >
          <WorkflowStepsEditor
            v-model="workflowSteps"
            embedded
          />
        </section>

        <!-- Requisites (read-only) -->
        <AgentVerificationReadOnly
          v-else-if="section === 'requisites'"
          :profile="profile"
        />

        <StickyActionBar
          v-if="hasSaveBar"
          class="bottom-4"
        >
          <div class="pes-bar">
            <button
              type="button"
              class="pes-cancel pressable"
              @click="backToHub"
            >
              {{ t.cancel }}
            </button>
            <button
              type="submit"
              class="rb-cta-btn flex-1"
              :disabled="agent.isSavingDetails"
            >
              <Loader2
                v-if="agent.isSavingDetails"
                class="size-4 animate-spin"
              />
              {{ agent.isSavingDetails ? t.saving : t.save }}
            </button>
          </div>
        </StickyActionBar>
      </form>
    </section>
  </div>
</template>

<style scoped>
.pes-why {
  display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: var(--rb-r-tile);
  background: var(--secondary); color: var(--secondary-foreground); font-size: 13px; line-height: 1.4;
}
.pes-why p { margin: 0; }
.pes-card {
  display: flex; flex-direction: column; gap: 14px; padding: 16px;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--rb-r-card); box-shadow: var(--rb-elev-1);
}
.pes-label { margin: 0 6px 8px; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted-foreground); }
.pes-preview {
  display: flex; gap: 12px; align-items: flex-start; padding: 14px;
  background: var(--card); border: 1px dashed var(--border); border-radius: var(--rb-r-card);
}
.pes-preview__name { margin: 0; font-family: var(--rb-font-display); font-size: 16px; font-weight: 800; color: var(--foreground); }
.pes-preview__bio {
  margin: 0; font-size: 13px; line-height: 1.4; color: var(--muted-foreground);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pes-preview__meta { margin: 2px 0 0; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--foreground); }
.pes-count { display: block; text-align: right; font-size: 12px; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }
.pes-hint { margin: 0; font-size: 12px; line-height: 1.45; color: var(--muted-foreground); }
.pes-bar {
  display: flex; gap: 10px; padding: 10px; border-radius: var(--rb-r-card);
  background: var(--card); border: 1px solid var(--border); box-shadow: var(--rb-elev-bar);
}
.pes-cancel {
  min-height: 52px; padding: 0 18px; border: 0; border-radius: var(--rb-r-field);
  background: var(--secondary); color: var(--secondary-foreground); font-size: 15px; font-weight: 700; cursor: pointer;
}
.pes-cancel:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
</style>
