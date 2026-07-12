<script setup lang="ts">
defineProps<{
  label: string
  htmlFor?: string
  hint?: string
}>()
</script>

<template>
  <div class="profile-form-field">
    <label
      v-if="label"
      :for="htmlFor"
      class="profile-form-label"
    >
      {{ label }}
    </label>
    <p
      v-if="hint"
      class="profile-form-hint"
    >
      {{ hint }}
    </p>
    <div class="profile-form-control">
      <slot />
    </div>
  </div>
</template>
