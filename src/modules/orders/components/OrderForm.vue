<script setup lang="ts">
import { Check, Loader2 } from '@lucide/vue'
import { reactive } from 'vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import FileUpload from '@/core/ui/FileUpload.vue'
import StickyActionBar from '@/core/ui/StickyActionBar.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import type { Category } from '@/modules/agent/types/agent'
import type { CreateOrderPayload } from '@/modules/orders/types/order'

defineProps<{
  categories: Category[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: CreateOrderPayload]
}>()

const form = reactive({
  category_id: null as number | null,
  description: '',
  tz_file_id: null as number | null,
})

const fieldErrors = reactive<Record<string, string>>({})

function selectCategory(id: number) {
  form.category_id = id
  delete fieldErrors.category_id
}

function validate(): boolean {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  if (form.category_id === null) fieldErrors.category_id = 'Choose a service.'
  if (form.description.trim() === '') fieldErrors.description = 'Add a short comment.'
  if (form.tz_file_id === null) fieldErrors.tz_file_id = 'Attach your brief (TZ).'

  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    category_id: form.category_id!,
    description: form.description.trim(),
    tz_file_id: form.tz_file_id!,
  })
}

const inputClass = 'glass-input'
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Category -->
    <GlassCard class="space-y-3">
      <div>
        <p class="text-sm font-medium">
          What service do you need? *
        </p>
        <p class="text-xs text-muted-foreground">
          Pick a category — specialists in it will be notified.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          :class="cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
            form.category_id === category.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'glass-chip',
          )"
          @click="selectCategory(category.id)"
        >
          <Check v-if="form.category_id === category.id" class="size-3.5" />
          {{ category.name_uz }}
        </button>
      </div>
      <p v-if="fieldErrors.category_id" class="text-xs text-destructive">
        {{ fieldErrors.category_id }}
      </p>
    </GlassCard>

    <!-- Brief + comment -->
    <GlassCard class="space-y-4">
      <FileUpload
        v-model="form.tz_file_id"
        label="Technical brief (TZ) *"
        hint="Upload your requirements — document or image, max 5 MB."
        :invalid="!!fieldErrors.tz_file_id"
      />
      <p v-if="fieldErrors.tz_file_id" class="-mt-2 text-xs text-destructive">
        {{ fieldErrors.tz_file_id }}
      </p>

      <div class="space-y-1.5">
        <label class="text-sm font-medium" for="description">Comment *</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          placeholder="Describe what you need, deadlines, any details…"
          :class="cn(inputClass, 'resize-none')"
        />
        <p v-if="fieldErrors.description" class="text-xs text-destructive">
          {{ fieldErrors.description }}
        </p>
      </div>
    </GlassCard>

    <StickyActionBar>
      <Button type="submit" class="h-12 w-full rounded-2xl text-base shadow-lg shadow-primary/20" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" />
        {{ submitting ? 'Sending…' : 'Send request' }}
      </Button>
    </StickyActionBar>
  </form>
</template>
