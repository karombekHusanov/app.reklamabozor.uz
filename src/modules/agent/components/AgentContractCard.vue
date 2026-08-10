<script setup lang="ts">
import { CircleCheck, Clock, Download, FileSignature, TriangleAlert } from '@lucide/vue'
import { computed, ref } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import type { AgentContract } from '@/modules/agent/types/agent'

const props = defineProps<{
  contract: AgentContract
  uploading?: boolean
}>()

const emit = defineEmits<{ upload: [fileId: number] }>()

const locale = useLocaleStore()

const uploadModel = ref<number | null>(null)

const status = computed(() => props.contract.status)
const canUpload = computed(() => status.value === 'awaiting_signature' || status.value === 'rejected')

const meta = computed(() => {
  switch (status.value) {
    case 'under_review':
      return {
        icon: Clock,
        label: locale.t.agent.contract.underReviewTitle,
        body: locale.t.agent.contract.underReviewBody,
        wrap: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      }
    case 'approved':
      return {
        icon: CircleCheck,
        label: locale.t.agent.contract.approvedTitle,
        body: locale.t.agent.contract.approvedBody,
        wrap: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      }
    case 'rejected':
      return {
        icon: TriangleAlert,
        label: locale.t.agent.contract.rejectedTitle,
        body: locale.t.agent.contract.rejectedBody,
        wrap: 'bg-red-500/12 text-red-600 dark:text-red-400',
        badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
      }
    default:
      return {
        icon: FileSignature,
        label: locale.t.agent.contract.awaitingTitle,
        body: locale.t.agent.contract.awaitingBody,
        wrap: 'bg-primary/12 text-primary',
        badge: 'bg-primary/15 text-primary',
      }
  }
})

function onUpload(fileId: number | null) {
  if (fileId != null) {
    emit('upload', fileId)
    // Let the parent re-render from the refreshed profile; clear the local field.
    uploadModel.value = null
  }
}
</script>

<template>
  <GlassCard class="space-y-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          :class="meta.wrap"
        >
          <component
            :is="meta.icon"
            class="size-6"
          />
        </div>
        <div class="min-w-0">
          <h3 class="truncate text-base font-semibold leading-tight">
            {{ locale.t.agent.contract.title }}
          </h3>
          <p class="mt-0.5 text-sm text-muted-foreground">
            {{ meta.body }}
          </p>
        </div>
      </div>
      <Badge
        class="shrink-0"
        :class="meta.badge"
      >
        {{ meta.label }}
      </Badge>
    </div>

    <!-- Rejection reason -->
    <div
      v-if="status === 'rejected' && contract.rejection_reason"
      class="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {{ contract.rejection_reason }}
    </div>

    <!-- Download the generated agreement -->
    <a
      v-if="contract.file && canUpload"
      :href="contract.file"
      target="_blank"
      rel="noopener"
      class="pressable flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
    >
      <Download class="size-4" />
      {{ locale.t.agent.contract.download }}
    </a>

    <!-- Upload the signed scan -->
    <FileUpload
      v-if="canUpload"
      v-model="uploadModel"
      :label="locale.t.agent.contract.uploadLabel"
      :hint="locale.t.agent.contract.uploadHint"
      accept="image/png,image/jpeg,image/webp,application/pdf"
      @update:model-value="onUpload"
    />

    <p
      v-if="uploading"
      class="text-center text-xs text-muted-foreground"
    >
      …
    </p>

    <!-- Link to the signed copy once uploaded -->
    <a
      v-if="!canUpload && contract.signed_file"
      :href="contract.signed_file"
      target="_blank"
      rel="noopener"
      class="pressable inline-flex items-center gap-2 text-sm font-medium text-primary"
    >
      <Download class="size-4" />
      {{ locale.t.agent.contract.viewSigned }}
    </a>
  </GlassCard>
</template>
