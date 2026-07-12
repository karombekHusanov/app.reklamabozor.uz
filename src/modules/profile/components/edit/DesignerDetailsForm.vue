<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import ImageUpload from '@/core/ui/ImageUpload.vue'
import { Button } from '@/core/ui/button'
import { useLocaleStore } from '@/core/i18n/locale.store'
import AdvantagesPicker from '@/modules/profile/components/edit/AdvantagesPicker.vue'
import CategoryCheckboxList from '@/modules/profile/components/edit/CategoryCheckboxList.vue'
import PortfolioManager from '@/modules/profile/components/edit/PortfolioManager.vue'
import ProfileEditSegmentTabs from '@/modules/profile/components/edit/ProfileEditSegmentTabs.vue'
import ProfileFormField from '@/modules/profile/components/edit/ProfileFormField.vue'
import ProfileFormSection from '@/modules/profile/components/edit/ProfileFormSection.vue'
import WorkflowStepsEditor from '@/modules/profile/components/edit/WorkflowStepsEditor.vue'
import { fetchAdvantagesCatalog } from '@/modules/agent/services/agent.service'
import type {
  Advantage,
  AgentDetailsPayload,
  AgentProfile,
  Category,
  WorkflowStep,
} from '@/modules/agent/types/agent'

type EditTab = 'brand' | 'categories' | 'links' | 'portfolio' | 'advantages' | 'workflow'

const locale = useLocaleStore()

const props = defineProps<{
  profile: AgentProfile
  categories: Category[]
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [payload: AgentDetailsPayload]
}>()

const activeTab = ref<EditTab>('brand')

const tabs = computed(() => [
  { key: 'brand' as const, label: locale.t.agent.editTabBrand },
  { key: 'categories' as const, label: locale.t.agent.editTabCategories },
  { key: 'links' as const, label: locale.t.designer.editTabLinks },
  { key: 'portfolio' as const, label: locale.t.agent.editTabPortfolio },
  { key: 'advantages' as const, label: locale.t.agent.editTabAdvantages },
  { key: 'workflow' as const, label: locale.t.agent.editTabWorkflow },
])

const showSaveBar = computed(() => activeTab.value !== 'portfolio')

const advantagesSubtitle = computed(() =>
  locale.t.agent.advantagesSelectedCount
    .replace('{count}', String(selectedAdvantageIds.value.length))
    .replace('{max}', '6'),
)

const workflowSubtitle = computed(() =>
  locale.t.profile.editWorkflowSubtitle
    .replace('{count}', String(workflowSteps.value.length))
    .replace('{max}', '6'),
)

const portfolioCount = ref(0)

const portfolioSubtitle = computed(() =>
  locale.t.profile.editPortfolioSubtitle
    .replace('{count}', String(portfolioCount.value))
    .replace('{max}', '12'),
)

const form = reactive({
  company_logo_file_id: props.profile.company_logo_file_id,
  bio: props.profile.bio ?? '',
  website_url: props.profile.website_url ?? '',
  linkedin_url: props.profile.linkedin_url ?? '',
  results_text: props.profile.results_text ?? '',
})

const selectedCategoryIds = ref<number[]>(props.profile.categories.map(c => c.id))

const advantagesCatalog = ref<Advantage[]>([])
const selectedAdvantageIds = ref<number[]>((props.profile.advantages ?? []).map(a => a.id))
const workflowSteps = ref<WorkflowStep[]>(
  (props.profile.workflow_steps ?? []).map(step => ({ ...step })),
)

onMounted(async () => {
  try {
    advantagesCatalog.value = await fetchAdvantagesCatalog()
  }
  catch {
    // Catalog is additive UI — the rest of the form still works without it.
  }
})

function handleSave() {
  emit('save', {
    company_logo_file_id: form.company_logo_file_id,
    bio: form.bio.trim() || null,
    website_url: form.website_url.trim() || null,
    linkedin_url: form.linkedin_url.trim() || null,
    results_text: form.results_text.trim() || null,
    category_ids: [...selectedCategoryIds.value],
    advantage_ids: [...selectedAdvantageIds.value],
    workflow_steps: workflowSteps.value
      .map(step => ({ title: step.title.trim(), description: step.description?.trim() || null }))
      .filter(step => step.title !== ''),
  })
}
</script>

<template>
  <div class="space-y-4">
    <ProfileEditSegmentTabs
      v-model="activeTab"
      :tabs="tabs"
    />

    <ProfileFormSection
      v-if="activeTab === 'portfolio'"
      :title="locale.t.profile.editPortfolioTitle"
      :subtitle="portfolioSubtitle"
    >
      <PortfolioManager
        embedded
        @update:count="portfolioCount = $event"
      />
    </ProfileFormSection>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="handleSave"
    >
      <ProfileFormSection
        v-if="activeTab === 'brand'"
        :title="locale.t.designer.brand"
      >
        <ProfileFormField
          :label="locale.t.designer.studioLogo"
          :hint="locale.t.designer.logoHint"
        >
          <ImageUpload
            v-model="form.company_logo_file_id"
            :preview-url="profile.company_logo"
          />
        </ProfileFormField>

        <ProfileFormField
          :label="locale.t.designer.aboutStudio"
          html-for="designer_bio"
        >
          <textarea
            id="designer_bio"
            v-model="form.bio"
            :placeholder="locale.t.designer.aboutPlaceholder"
            class="glass-input profile-form-textarea profile-form-textarea--lg"
          />
        </ProfileFormField>

        <ProfileFormField
          :label="locale.t.designer.resultsHighlights"
          html-for="designer_results_text"
        >
          <textarea
            id="designer_results_text"
            v-model="form.results_text"
            :placeholder="locale.t.designer.resultsPlaceholder"
            class="glass-input profile-form-textarea"
          />
        </ProfileFormField>
      </ProfileFormSection>

      <ProfileFormSection
        v-if="activeTab === 'categories'"
        :title="locale.t.designer.serviceCategories"
        :subtitle="locale.t.designer.servicePickHint"
      >
        <CategoryCheckboxList
          v-model="selectedCategoryIds"
          :categories="categories"
        />
      </ProfileFormSection>

      <ProfileFormSection
        v-if="activeTab === 'links'"
        :title="locale.t.designer.linksLocation"
      >
        <ProfileFormField
          :label="locale.t.designer.website"
          html-for="designer_website_url"
        >
          <input
            id="designer_website_url"
            v-model="form.website_url"
            type="url"
            inputmode="url"
            placeholder="https://behance.net/…"
            class="glass-input profile-form-input"
          >
        </ProfileFormField>

        <ProfileFormField
          :label="locale.t.designer.linkedin"
          html-for="designer_linkedin_url"
        >
          <input
            id="designer_linkedin_url"
            v-model="form.linkedin_url"
            type="url"
            inputmode="url"
            placeholder="https://dribbble.com/…"
            class="glass-input profile-form-input"
          >
        </ProfileFormField>
      </ProfileFormSection>

      <ProfileFormSection
        v-if="activeTab === 'advantages' && advantagesCatalog.length > 0"
        :title="locale.t.profile.editAdvantagesTitle"
        :subtitle="advantagesSubtitle"
      >
        <AdvantagesPicker
          v-model="selectedAdvantageIds"
          :catalog="advantagesCatalog"
          embedded
        />
      </ProfileFormSection>

      <ProfileFormSection
        v-if="activeTab === 'advantages' && advantagesCatalog.length === 0"
        :title="locale.t.profile.editAdvantagesTitle"
      >
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ locale.t.agent.noAdvantagesCatalog }}
        </p>
      </ProfileFormSection>

      <ProfileFormSection
        v-if="activeTab === 'workflow'"
        :title="locale.t.profile.editWorkflowTitle"
        :subtitle="workflowSubtitle"
      >
        <WorkflowStepsEditor
          v-model="workflowSteps"
          embedded
        />
      </ProfileFormSection>

      <StickyActionBar v-if="showSaveBar">
        <Button
          type="submit"
          class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20"
          :disabled="saving"
        >
          <Loader2
            v-if="saving"
            class="size-4 animate-spin"
          />
          {{ saving ? locale.t.designer.saving : locale.t.designer.saveProfile }}
        </Button>
      </StickyActionBar>
    </form>
  </div>
</template>
