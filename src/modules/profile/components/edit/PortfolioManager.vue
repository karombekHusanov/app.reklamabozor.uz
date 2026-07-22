<script setup lang="ts">
import {
  ExternalLink,
  EyeOff,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from '@lucide/vue'
import { onMounted, reactive, ref, watch } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import { Button } from '@/core/ui/button'
import { useFileUpload } from '@/core/composables/useFileUpload'
import { getApiErrorMessage } from '@/core/api/api-error'
import { openExternalLink } from '@/core/lib/telegram-init'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PortfolioDraftFields from '@/modules/profile/components/edit/PortfolioDraftFields.vue'
import type { PortfolioItemDraft, PortfolioMediaDraft } from '@/modules/profile/types/portfolio'
import {
  addPortfolioItem,
  deletePortfolioItem,
  fetchMyPortfolio,
  updatePortfolioItem,
} from '@/modules/agent/services/agent.service'
import type { PortfolioFile, PortfolioItem } from '@/modules/agent/types/agent'

const MAX_ITEMS = 12

const props = defineProps<{
  /** Drop outer card chrome when rendered inside a tab panel. */
  embedded?: boolean
}>()

const emit = defineEmits<{
  'update:count': [count: number]
}>()

const locale = useLocaleStore()
const { isUploading, error: uploadError, upload } = useFileUpload()

const items = ref<PortfolioItem[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showAddForm = ref(false)
const editingId = ref<number | null>(null)

const imageInputRef = ref<HTMLInputElement | null>(null)
const attachmentInputRef = ref<HTMLInputElement | null>(null)
const activeDraft = ref<'add' | 'edit'>('add')

const addDraft = reactive<PortfolioItemDraft>(emptyDraft())
const editDraft = reactive<PortfolioItemDraft>(emptyDraft())

watch(items, (list) => {
  emit('update:count', list.length)
}, { immediate: true })

onMounted(async () => {
  try {
    items.value = await fetchMyPortfolio()
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    isLoading.value = false
  }
})

function emptyDraft(): PortfolioItemDraft {
  return {
    images: [],
    attachments: [],
    title: '',
    description: '',
    link_url: '',
  }
}

function resetAddDraft() {
  Object.assign(addDraft, emptyDraft())
}

function itemLabel(index: number): string {
  return locale.t.profile.editPortfolioBlockLabel.replace('{n}', String(index + 1))
}

function toMediaDraft(file: PortfolioFile): PortfolioMediaDraft {
  return {
    id: file.id,
    url: file.url,
    name: file.original_name,
    mime: file.mime_type,
    size: file.size,
  }
}

function draftFromItem(item: PortfolioItem): PortfolioItemDraft {
  const images = item.images.length > 0
    ? item.images.map(toMediaDraft)
    : item.image
      ? [{ id: -item.id, url: item.image, name: item.title, mime: 'image/jpeg', size: 0 }]
      : []

  return {
    images,
    attachments: item.attachments.map(toMediaDraft),
    title: item.title,
    description: item.description ?? '',
    link_url: item.link_url ?? '',
  }
}

function currentDraft(): PortfolioItemDraft {
  return activeDraft.value === 'add' ? addDraft : editDraft
}

function pickImages() {
  imageInputRef.value?.click()
}

function pickAttachments() {
  attachmentInputRef.value?.click()
}

async function onImageSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  const uploaded = await upload(file)
  if (!uploaded) return

  currentDraft().images.push({
    id: uploaded.id,
    url: uploaded.url,
    name: uploaded.original_name,
    mime: uploaded.mime_type ?? '',
    size: uploaded.size,
  })
}

async function onAttachmentSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  const uploaded = await upload(file)
  if (!uploaded) return

  currentDraft().attachments.push({
    id: uploaded.id,
    url: uploaded.url,
    name: uploaded.original_name,
    mime: uploaded.mime_type ?? '',
    size: uploaded.size,
  })
}

function removeImage(draft: PortfolioItemDraft, index: number) {
  draft.images.splice(index, 1)
}

function removeAttachment(draft: PortfolioItemDraft, index: number) {
  draft.attachments.splice(index, 1)
}

function canSave(draft: PortfolioItemDraft): boolean {
  return draft.images.length > 0 && draft.title.trim() !== ''
}

function payloadFromDraft(draft: PortfolioItemDraft) {
  return {
    image_file_ids: draft.images.map(image => image.id),
    attachment_file_ids: draft.attachments.map(file => file.id),
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    link_url: draft.link_url.trim() || null,
  }
}

async function submitAdd() {
  if (!canSave(addDraft) || isSaving.value) return
  isSaving.value = true
  error.value = null

  try {
    const item = await addPortfolioItem(payloadFromDraft(addDraft))
    items.value.push(item)
    resetAddDraft()
    showAddForm.value = false
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    isSaving.value = false
  }
}

function startEdit(item: PortfolioItem) {
  editingId.value = item.id
  activeDraft.value = 'edit'
  Object.assign(editDraft, draftFromItem(item))
  showAddForm.value = false
}

function cancelEdit() {
  editingId.value = null
  Object.assign(editDraft, emptyDraft())
}

async function submitEdit() {
  if (editingId.value === null || !canSave(editDraft) || isSaving.value) return
  isSaving.value = true
  error.value = null

  try {
    const updated = await updatePortfolioItem(editingId.value, payloadFromDraft(editDraft))
    const index = items.value.findIndex(item => item.id === editingId.value)
    if (index !== -1) items.value[index] = updated
    cancelEdit()
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
  finally {
    isSaving.value = false
  }
}

async function remove(id: number) {
  error.value = null
  try {
    await deletePortfolioItem(id)
    items.value = items.value.filter(item => item.id !== id)
    if (editingId.value === id) cancelEdit()
  }
  catch (e) {
    error.value = getApiErrorMessage(e)
  }
}

function openAddForm() {
  showAddForm.value = true
  editingId.value = null
  activeDraft.value = 'add'
  resetAddDraft()
}

function openLink(url: string) {
  openExternalLink(url)
}

function displayImages(item: PortfolioItem): Array<{ url: string, original_name: string }> {
  if (item.images.length > 0) return item.images
  if (item.image) return [{ url: item.image, original_name: item.title }]
  return []
}
</script>

<template>
  <component
    :is="props.embedded ? 'div' : GlassCard"
    class="portfolio-manager"
  >
    <div
      v-if="!embedded"
      class="flex items-baseline justify-between"
    >
      <p class="text-sm font-semibold">
        {{ locale.t.profile.editPortfolioTitle }}
      </p>
      <span class="text-xs text-muted-foreground">{{ items.length }}/{{ MAX_ITEMS }}</span>
    </div>

    <p
      v-if="embedded"
      class="portfolio-manager__intro"
    >
      {{ locale.t.profile.editPortfolioHint }}
    </p>
    <p
      v-else
      class="text-xs text-muted-foreground"
    >
      {{ locale.t.profile.editPortfolioHint }}
    </p>

    <Loader2
      v-if="isLoading"
      class="mx-auto size-5 animate-spin text-muted-foreground"
    />

    <template v-else>
      <div
        v-if="items.length === 0 && !showAddForm"
        class="portfolio-manager-empty"
      >
        <p class="portfolio-manager-empty__text">
          {{ locale.t.profile.editPortfolioEmpty }}
        </p>
        <button
          type="button"
          class="portfolio-manager-add portfolio-manager-add--primary pressable"
          @click="openAddForm"
        >
          <ImagePlus class="size-4" />
          {{ locale.t.profile.editPortfolioAddFirst }}
        </button>
      </div>

      <div
        v-else-if="items.length > 0"
        class="portfolio-manager-list"
      >
        <article
          v-for="(item, index) in items"
          :key="item.id"
          class="portfolio-item-card"
          :class="item.is_hidden ? 'portfolio-item-card--hidden' : ''"
        >
          <div class="portfolio-item-card__header">
            <div class="portfolio-item-card__badge">
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="portfolio-item-card__title">
                {{ editingId === item.id ? itemLabel(index) : item.title }}
              </p>
              <p
                v-if="item.is_hidden"
                class="portfolio-item-card__hidden"
              >
                <EyeOff class="size-3.5" />
                {{ locale.t.profile.editPortfolioHidden }}
              </p>
              <p
                v-else-if="editingId !== item.id && item.description"
                class="portfolio-item-card__hint"
              >
                {{ item.description }}
              </p>
            </div>
            <div class="flex shrink-0 gap-1.5">
              <button
                v-if="editingId !== item.id"
                type="button"
                class="portfolio-item-card__action pressable"
                :aria-label="locale.t.profile.editPortfolioEdit"
                @click="startEdit(item)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="portfolio-item-card__action portfolio-item-card__action--danger pressable"
                :aria-label="locale.t.profile.editPortfolioRemove"
                @click="remove(item.id)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>

          <div
            v-if="editingId !== item.id"
            class="portfolio-item-card__body"
          >
            <div
              v-if="displayImages(item).length > 0"
              class="portfolio-item-card__gallery"
            >
              <img
                v-for="(image, imageIndex) in displayImages(item)"
                :key="`${item.id}-${imageIndex}`"
                :src="image.url"
                :alt="item.title"
                class="portfolio-item-card__gallery-image"
              >
            </div>

            <button
              v-if="item.link_url"
              type="button"
              class="portfolio-item-card__link"
              @click="openLink(item.link_url)"
            >
              <ExternalLink class="size-3.5 shrink-0" />
              <span class="truncate">{{ item.link_url }}</span>
            </button>

            <div
              v-if="item.attachments.length > 0"
              class="portfolio-item-card__attachments"
            >
              <p class="portfolio-item-card__attachments-label">
                {{ locale.t.profile.editPortfolioAttachmentsLabel }}
              </p>
              <div
                v-for="file in item.attachments"
                :key="file.id"
                class="portfolio-item-card__attachment"
              >
                <FileText class="size-4 shrink-0 text-primary" />
                <span class="min-w-0 truncate text-sm">{{ file.original_name }}</span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="portfolio-item-card__body space-y-5"
          >
            <PortfolioDraftFields
              :draft="editDraft"
              :is-uploading="isUploading"
              @pick-images="pickImages"
              @pick-attachments="pickAttachments"
              @remove-image="removeImage(editDraft, $event)"
              @remove-attachment="removeAttachment(editDraft, $event)"
            />

            <div class="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                class="flex-1 rounded-2xl"
                @click="cancelEdit"
              >
                {{ locale.t.common.cancel }}
              </Button>
              <Button
                type="button"
                class="flex-1 rounded-2xl"
                :disabled="!canSave(editDraft) || isSaving"
                @click="submitEdit"
              >
                <Loader2
                  v-if="isSaving"
                  class="size-4 animate-spin"
                />
                <template v-else>
                  {{ locale.t.profile.editPortfolioUpdate }}
                </template>
              </Button>
            </div>
          </div>
        </article>
      </div>

      <article
        v-if="showAddForm"
        class="portfolio-item-card portfolio-item-card--draft"
      >
        <div class="portfolio-item-card__header">
          <div class="portfolio-item-card__badge">
            <Plus class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="portfolio-item-card__title">
              {{ locale.t.profile.editPortfolioAddBlockTitle }}
            </p>
            <p class="portfolio-item-card__hint">
              {{ locale.t.profile.editPortfolioAddBlockHint }}
            </p>
          </div>
        </div>

        <div class="portfolio-item-card__body space-y-5">
          <PortfolioDraftFields
            :draft="addDraft"
            :is-uploading="isUploading"
            @pick-images="pickImages"
            @pick-attachments="pickAttachments"
            @remove-image="removeImage(addDraft, $event)"
            @remove-attachment="removeAttachment(addDraft, $event)"
          />

          <div class="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              class="flex-1 rounded-2xl"
              @click="showAddForm = false"
            >
              {{ locale.t.common.cancel }}
            </Button>
            <Button
              type="button"
              class="flex-1 rounded-2xl"
              :disabled="!canSave(addDraft) || isSaving"
              @click="submitAdd"
            >
              <Loader2
                v-if="isSaving"
                class="size-4 animate-spin"
              />
              <template v-else>
                {{ locale.t.profile.editPortfolioSave }}
              </template>
            </Button>
          </div>
        </div>
      </article>

      <button
        v-if="items.length > 0 && items.length < MAX_ITEMS && !showAddForm && editingId === null"
        type="button"
        class="portfolio-manager-add pressable"
        @click="openAddForm"
      >
        <Plus class="size-4" />
        {{ locale.t.profile.editPortfolioAdd }}
      </button>
    </template>

    <input
      ref="imageInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="onImageSelected"
    >
    <input
      ref="attachmentInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,application/pdf"
      class="hidden"
      @change="onAttachmentSelected"
    >

    <p
      v-if="uploadError"
      class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {{ uploadError }}
    </p>

    <p
      v-if="error"
      class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {{ error }}
    </p>
  </component>
</template>
