<script setup lang="ts">
import { ArrowDown, Plus, Trash2 } from '@lucide/vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import ProfileFormField from '@/modules/profile/components/edit/ProfileFormField.vue'
import type { WorkflowStep } from '@/modules/agent/types/agent'

const MAX_STEPS = 6

const props = defineProps<{
  modelValue: WorkflowStep[]
  embedded?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: WorkflowStep[]]
}>()

const locale = useLocaleStore()

function stepLabel(index: number): string {
  return locale.t.profile.editWorkflowStepLabel.replace('{n}', String(index + 1))
}

function patch(index: number, field: keyof WorkflowStep, value: string) {
  const next = props.modelValue.map((step, i) =>
    i === index ? { ...step, [field]: value } : step,
  )
  emit('update:modelValue', next)
}

function addStep() {
  if (props.modelValue.length >= MAX_STEPS) return
  emit('update:modelValue', [...props.modelValue, { title: '', description: '' }])
}

function removeStep(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="workflow-steps-editor">
    <div
      v-if="!embedded"
      class="flex items-baseline justify-between"
    >
      <p class="text-sm font-semibold">
        {{ locale.t.profile.editWorkflowTitle }}
      </p>
      <span class="text-xs text-muted-foreground">{{ modelValue.length }}/{{ MAX_STEPS }}</span>
    </div>

    <p
      v-if="embedded"
      class="workflow-steps-editor__intro"
    >
      {{ locale.t.profile.editWorkflowIntro }}
    </p>

    <div
      v-if="modelValue.length === 0"
      class="workflow-steps-empty"
    >
      <p class="workflow-steps-empty__text">
        {{ locale.t.profile.editWorkflowEmpty }}
      </p>
      <button
        type="button"
        class="workflow-steps-add workflow-steps-add--primary pressable"
        @click="addStep"
      >
        <Plus class="size-4" />
        {{ locale.t.profile.editWorkflowAddFirst }}
      </button>
    </div>

    <div
      v-else
      class="workflow-steps-list"
    >
      <template
        v-for="(step, index) in modelValue"
        :key="index"
      >
        <article class="workflow-step-card">
          <div class="workflow-step-card__header">
            <div class="workflow-step-card__badge">
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="workflow-step-card__title">
                {{ stepLabel(index) }}
              </p>
              <p class="workflow-step-card__hint">
                {{ locale.t.profile.editWorkflowStepHintShort }}
              </p>
            </div>
            <button
              type="button"
              class="workflow-step-card__remove pressable"
              :aria-label="locale.t.profile.editWorkflowRemove"
              @click="removeStep(index)"
            >
              <Trash2 class="size-4" />
            </button>
          </div>

          <div class="workflow-step-card__body">
            <ProfileFormField
              :label="locale.t.profile.editWorkflowStepNameLabel"
              :html-for="`workflow-step-title-${index}`"
            >
              <input
                :id="`workflow-step-title-${index}`"
                :value="step.title"
                type="text"
                maxlength="80"
                :placeholder="locale.t.profile.editWorkflowStepTitlePlaceholder"
                class="glass-input profile-form-input"
                @input="patch(index, 'title', ($event.target as HTMLInputElement).value)"
              >
            </ProfileFormField>

            <ProfileFormField
              :label="locale.t.profile.editWorkflowStepDescLabel"
              :html-for="`workflow-step-desc-${index}`"
              :hint="locale.t.profile.editWorkflowStepHint"
            >
              <textarea
                :id="`workflow-step-desc-${index}`"
                :value="step.description ?? ''"
                rows="2"
                maxlength="200"
                :placeholder="locale.t.profile.editWorkflowStepDescPlaceholder"
                class="glass-input profile-form-textarea profile-form-textarea--compact"
                @input="patch(index, 'description', ($event.target as HTMLTextAreaElement).value)"
              />
            </ProfileFormField>
          </div>
        </article>

        <div
          v-if="index < modelValue.length - 1"
          class="workflow-step-connector"
          aria-hidden="true"
        >
          <ArrowDown class="size-4" />
        </div>
      </template>
    </div>

    <button
      v-if="modelValue.length > 0 && modelValue.length < MAX_STEPS"
      type="button"
      class="workflow-steps-add pressable"
      @click="addStep"
    >
      <Plus class="size-4" />
      {{ locale.t.profile.editWorkflowAdd }}
    </button>
  </div>
</template>
