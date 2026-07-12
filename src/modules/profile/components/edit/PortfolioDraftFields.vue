<script setup lang="ts">
import { CloudUpload, FileText, X } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ProfileFormField from '@/modules/profile/components/edit/ProfileFormField.vue'
import { formatFileSize, isImageFile } from '@/modules/orders/lib/wizard'
import type { PortfolioItemDraft } from '@/modules/profile/types/portfolio'

const MAX_IMAGES = 10
const MAX_ATTACHMENTS = 5

defineProps<{
  draft: PortfolioItemDraft
  isUploading: boolean
}>()

const emit = defineEmits<{
  'pick-images': []
  'pick-attachments': []
  'remove-image': [index: number]
  'remove-attachment': [index: number]
}>()

const locale = useLocaleStore()
</script>

<template>
  <div class="space-y-5">
    <ProfileFormField :label="locale.t.profile.editPortfolioImagesLabel">
      <button
        v-if="draft.images.length < MAX_IMAGES"
        type="button"
        class="glass-field flex w-full flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center"
        :disabled="isUploading"
        @click="emit('pick-images')"
      >
        <span class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudUpload class="size-5" />
        </span>
        <span class="text-sm font-semibold text-foreground">
          {{ locale.t.profile.editPortfolioImagesDrop }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ locale.t.profile.editPortfolioImagesHint }}
        </span>
      </button>

      <div
        v-if="draft.images.length > 0"
        class="mt-3 grid grid-cols-3 gap-2"
      >
        <div
          v-for="(image, index) in draft.images"
          :key="`${image.id}-${index}`"
          class="relative overflow-hidden rounded-xl border border-border/70"
        >
          <img
            :src="image.url"
            alt=""
            class="aspect-square w-full object-cover"
          >
          <button
            type="button"
            class="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
            @click="emit('remove-image', index)"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </div>
    </ProfileFormField>

    <ProfileFormField
      :label="locale.t.profile.editPortfolioItemTitle"
      html-for="portfolio-draft-title"
    >
      <input
        id="portfolio-draft-title"
        v-model="draft.title"
        type="text"
        maxlength="120"
        :placeholder="locale.t.profile.editPortfolioItemTitle"
        class="glass-input profile-form-input w-full"
      >
    </ProfileFormField>

    <ProfileFormField :label="locale.t.profile.editPortfolioItemDesc">
      <textarea
        v-model="draft.description"
        rows="3"
        maxlength="500"
        :placeholder="locale.t.profile.editPortfolioItemDesc"
        class="glass-input profile-form-textarea w-full resize-none"
      />
    </ProfileFormField>

    <ProfileFormField :label="locale.t.profile.editPortfolioItemLink">
      <input
        v-model="draft.link_url"
        type="url"
        maxlength="500"
        :placeholder="locale.t.profile.editPortfolioItemLink"
        class="glass-input profile-form-input w-full"
      >
    </ProfileFormField>

    <ProfileFormField :label="locale.t.profile.editPortfolioAttachmentsLabel">
      <button
        v-if="draft.attachments.length < MAX_ATTACHMENTS"
        type="button"
        class="glass-field flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium text-muted-foreground"
        :disabled="isUploading"
        @click="emit('pick-attachments')"
      >
        <FileText class="size-4" />
        {{ locale.t.profile.editPortfolioAttachmentsDrop }}
      </button>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ locale.t.profile.editPortfolioAttachmentsHint }}
      </p>

      <div
        v-if="draft.attachments.length > 0"
        class="mt-3 space-y-2"
      >
        <div
          v-for="(file, index) in draft.attachments"
          :key="file.id"
          class="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5"
        >
          <span class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
            <img
              v-if="isImageFile(file.mime)"
              :src="file.url"
              alt=""
              class="size-full object-cover"
            >
            <FileText
              v-else
              class="size-5"
            />
          </span>
          <span class="min-w-0 grow">
            <span class="block truncate text-sm font-medium">{{ file.name }}</span>
            <span class="block text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</span>
          </span>
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
            @click="emit('remove-attachment', index)"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    </ProfileFormField>
  </div>
</template>
