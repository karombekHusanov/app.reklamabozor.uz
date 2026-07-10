<script setup lang="ts">
import { inject } from 'vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { WIZARD_KEY } from '@/modules/orders/components/wizard/context'
import DeadlinePicker from '@/modules/orders/components/wizard/DeadlinePicker.vue'
import { BUDGET_OPTIONS } from '@/modules/orders/lib/wizard'

const locale = useLocaleStore()
const ctx = inject(WIZARD_KEY)!
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-1">
      <h2 class="text-lg font-bold text-foreground">
        {{ locale.t.orders.wizard.briefTitle }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ locale.t.orders.wizard.briefSubtitle }}
      </p>
    </div>

    <!-- Project name -->
    <div class="space-y-1.5">
      <label
        class="text-sm font-medium text-foreground"
        for="order-title"
      >
        {{ locale.t.orders.wizard.projectNameLabel }}
      </label>
      <input
        id="order-title"
        v-model="ctx.draft.title"
        type="text"
        class="glass-input"
        :placeholder="locale.t.orders.wizard.projectNamePlaceholder"
        @input="delete ctx.errors.title"
      >
      <p
        v-if="ctx.errors.title"
        class="text-xs text-destructive"
      >
        {{ ctx.errors.title }}
      </p>
    </div>

    <!-- Description -->
    <div class="space-y-1.5">
      <label
        class="text-sm font-medium text-foreground"
        for="order-description"
      >
        {{ locale.t.orders.wizard.descriptionLabel }}
      </label>
      <textarea
        id="order-description"
        v-model="ctx.draft.description"
        rows="4"
        class="glass-input resize-none"
        :placeholder="locale.t.orders.wizard.descriptionPlaceholder"
        @input="delete ctx.errors.description"
      />
      <p
        v-if="ctx.errors.description"
        class="text-xs text-destructive"
      >
        {{ ctx.errors.description }}
      </p>
    </div>

    <!-- Deadline -->
    <div class="space-y-1.5">
      <span class="text-sm font-medium text-foreground">
        {{ locale.t.orders.wizard.deadlineLabel }}
      </span>
      <DeadlinePicker v-model="ctx.draft.deadline_date" />
    </div>

    <!-- Budget -->
    <div class="space-y-1.5">
      <label
        class="text-sm font-medium text-foreground"
        for="order-budget"
      >
        {{ locale.t.orders.wizard.budgetLabel }}
      </label>
      <select
        id="order-budget"
        v-model="ctx.draft.budget"
        class="glass-input appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
        :class="ctx.draft.budget === null && 'text-muted-foreground'"
      >
        <option
          :value="null"
          disabled
        >
          {{ locale.t.orders.wizard.budgetPlaceholder }}
        </option>
        <option
          v-for="value in BUDGET_OPTIONS"
          :key="value"
          :value="value"
          class="text-foreground"
        >
          {{ locale.t.orders.wizard.budgets[value] }}
        </option>
      </select>
    </div>
  </div>
</template>
