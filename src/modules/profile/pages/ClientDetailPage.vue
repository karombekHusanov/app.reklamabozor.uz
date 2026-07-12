<script setup lang="ts">
import { UserRound } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { useLocaleStore } from '@/core/i18n/locale.store'
import PublicClientProfileView from '@/modules/profile/components/PublicClientProfileView.vue'
import { fetchPublicClient, type PublicClient } from '@/modules/profile/services/clients.service'

const props = defineProps<{ id: string }>()

const locale = useLocaleStore()
const client = ref<PublicClient | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    client.value = await fetchPublicClient(Number(props.id))
  }
  catch {
    client.value = null
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <template v-if="loading">
      <section class="space-y-4 px-4 pt-2">
        <Skeleton class="h-44 w-full rounded-[28px]" />
        <Skeleton class="h-36 w-full rounded-[28px]" />
        <Skeleton class="h-28 w-full rounded-[28px]" />
      </section>
    </template>

    <PublicClientProfileView
      v-else-if="client"
      :client="client"
      :locale="locale"
    />

    <section
      v-else
      class="px-5 pt-4"
    >
      <EmptyState
        :icon="UserRound"
        :title="locale.t.profile.clientPageTitle"
        :description="locale.t.profile.guestBody"
      />
    </section>
  </div>
</template>
