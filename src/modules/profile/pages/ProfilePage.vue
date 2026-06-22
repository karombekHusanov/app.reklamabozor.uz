<script setup lang="ts">
import {
  ArrowRight,
  ClipboardList,
  LogOut,
  Megaphone,
  Phone,
  Plus,
  Store,
  UserRound,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TelegramLoginButton from '@/modules/auth/components/TelegramLoginButton.vue'
import AppHeader from '@/modules/shell/components/AppHeader.vue'
import GlassCard from '@/core/ui/GlassCard.vue'
import Badge from '@/core/ui/Badge.vue'
import Avatar from '@/core/ui/Avatar.vue'
import AvatarUpload from '@/core/ui/AvatarUpload.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import Skeleton from '@/core/ui/Skeleton.vue'
import { Button } from '@/core/ui/button'
import { cn } from '@/core/lib/utils'
import CategoryChips from '@/modules/agent/components/CategoryChips.vue'
import OrderCard from '@/modules/orders/components/OrderCard.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fullName, roleLabel } from '@/modules/auth/types/user'

const auth = useAuthStore()
const agent = useAgentStore()
const orders = useOrdersStore()
const router = useRouter()

type Tab = 'profile' | 'orders'
const activeTab = ref<Tab>('profile')

const user = computed(() => auth.user)
const displayName = computed(() => (user.value ? fullName(user.value) : ''))
const isAgent = computed(() => agent.isApproved)

const memberSince = computed(() => {
  if (!user.value) return ''
  return new Date(user.value.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

async function load() {
  if (!auth.isAuthenticated) return
  await Promise.all([agent.loadProfile(), orders.loadMyOrders()])
}

async function handleAvatarChange(fileId: number | null) {
  await auth.saveAvatar(fileId)
}

onMounted(load)
watch(() => auth.isAuthenticated, load)

function openOrder(id: number) {
  router.push(`/orders/${id}`)
}

async function handleLogout() {
  await auth.logout()
  agent.reset()
  orders.reset()
  await router.replace(ROUTES.home)
}

function tabClass(tab: Tab) {
  return cn(
    'flex-1 rounded-xl py-2 text-sm font-medium transition-colors',
    activeTab.value === tab
      ? 'glass-segment-active'
      : 'text-muted-foreground',
  )
}
</script>

<template>
  <div>
    <AppHeader
      title="Profile"
      :subtitle="isAgent ? 'Your agent account' : 'Your AdSpace account'"
    />

    <section class="space-y-5 px-5">
      <template v-if="auth.isAuthenticated && user">
        <!-- Tabs -->
        <div class="glass-segment flex gap-1 rounded-2xl p-1">
          <button type="button" :class="tabClass('profile')" @click="activeTab = 'profile'">
            My Profile
          </button>
          <button type="button" :class="tabClass('orders')" @click="activeTab = 'orders'">
            My Orders
          </button>
        </div>

        <!-- ============ MY PROFILE TAB ============ -->
        <template v-if="activeTab === 'profile'">
          <!-- Identity -->
          <GlassCard class="flex items-center gap-4">
            <AvatarUpload
              :model-value="user.avatar_file_id"
              :preview-url="user.avatar"
              :name="displayName"
              size="lg"
              @update:model-value="handleAvatarChange"
            />
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-xl font-semibold">
                {{ displayName }}
              </h2>
              <p v-if="user.username" class="truncate text-sm text-muted-foreground">
                @{{ user.username }}
              </p>
              <div class="mt-3">
                <Badge :variant="isAgent ? 'success' : 'primary'" class="uppercase">
                  {{ isAgent ? 'Agent' : roleLabel(user.role) }}
                </Badge>
              </div>
            </div>
          </GlassCard>

          <!-- Contact -->
          <div class="grid grid-cols-1 gap-3">
            <GlassCard class="flex items-center gap-3">
              <Phone class="size-5 shrink-0 text-primary" />
              <div class="min-w-0">
                <p class="text-sm text-muted-foreground">
                  Phone
                </p>
                <p class="font-medium">
                  {{ user.phone ?? 'Not added yet' }}
                </p>
              </div>
            </GlassCard>

            <GlassCard class="flex items-center gap-3">
              <UserRound class="size-5 shrink-0 text-primary" />
              <div class="min-w-0">
                <p class="text-sm text-muted-foreground">
                  Telegram ID
                </p>
                <p class="font-medium">
                  {{ user.telegram_id }}
                </p>
              </div>
            </GlassCard>
          </div>

          <!-- Agency (approved agents) -->
          <GlassCard v-if="isAgent && agent.profile" class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <Avatar
                  v-if="agent.profile.company_logo"
                  :src="agent.profile.company_logo"
                  :name="agent.profile.company_name"
                  size="md"
                />
                <div v-else class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store class="size-6" />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-lg font-semibold leading-tight">
                    {{ agent.profile.company_name }}
                  </p>
                  <p class="mt-0.5 text-sm text-muted-foreground">
                    Verified marketplace profile
                  </p>
                </div>
              </div>
              <Badge variant="success" class="shrink-0">
                Approved
              </Badge>
            </div>

            <div
              v-if="agent.profile.categories.length"
              class="border-t border-black/5 pt-4 dark:border-white/10"
            >
              <p class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Works in
              </p>
              <CategoryChips :categories="agent.profile.categories" />
            </div>

            <Button
              variant="outline"
              class="h-11 w-full rounded-2xl"
              @click="router.push(ROUTES.agentHub)"
            >
              Manage agent profile
              <ArrowRight class="size-4" />
            </Button>
          </GlassCard>

          <!-- Become an agent / application status (non-agents) -->
          <GlassCard
            v-else
            class="flex items-center gap-4"
            interactive
            @click="router.push(ROUTES.agentHub)"
          >
            <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone class="size-6" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold">
                <template v-if="agent.isPending">
                  Application under review
                </template>
                <template v-else-if="agent.isRejected">
                  Application needs changes
                </template>
                <template v-else>
                  Become an advertising agent
                </template>
              </p>
              <p class="truncate text-sm text-muted-foreground">
                <template v-if="agent.isPending">
                  Tap to view your application status.
                </template>
                <template v-else-if="agent.isRejected">
                  Tap to review feedback and resubmit.
                </template>
                <template v-else>
                  Offer your services and receive client orders.
                </template>
              </p>
            </div>
            <ArrowRight class="size-5 shrink-0 text-muted-foreground" />
          </GlassCard>

          <GlassCard>
            <p class="text-sm text-muted-foreground">
              Member since
            </p>
            <p class="mt-1 font-medium">
              {{ memberSince }}
            </p>
          </GlassCard>

          <Button
            variant="outline"
            class="h-12 w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10"
            @click="handleLogout"
          >
            <LogOut class="size-4" />
            Sign out
          </Button>
        </template>

        <!-- ============ MY ORDERS TAB ============ -->
        <template v-else>
          <template v-if="orders.isLoading && orders.myOrders.length === 0">
            <Skeleton v-for="n in 3" :key="n" class="h-28 w-full rounded-3xl" />
          </template>

          <GlassCard
            v-else-if="orders.myOrders.length === 0"
            padding="none"
            class="overflow-hidden"
          >
            <EmptyState
              :icon="ClipboardList"
              title="No orders yet"
              description="Place a request and agencies will send you offers."
            >
              <Button class="mt-1 rounded-2xl" @click="router.push(ROUTES.newOrder)">
                <Plus class="size-4" />
                New request
              </Button>
            </EmptyState>
          </GlassCard>

          <template v-else>
            <Button class="h-11 w-full rounded-2xl" @click="router.push(ROUTES.newOrder)">
              <Plus class="size-4" />
              New request
            </Button>
            <OrderCard
              v-for="order in orders.myOrders"
              :key="order.id"
              :order="order"
              @open="openOrder(order.id)"
            />
          </template>
        </template>
      </template>

      <!-- ============ GUEST ============ -->
      <template v-else>
        <GlassCard class="space-y-4 text-center">
          <Avatar name="Guest" size="lg" class="mx-auto" />
          <div class="space-y-2">
            <h2 class="text-xl font-semibold">
              You are browsing as a guest
            </h2>
            <p class="text-sm leading-relaxed text-muted-foreground">
              Sign in with Telegram to save your profile and access agent features.
            </p>
          </div>
          <TelegramLoginButton />
          <p
            v-if="auth.error"
            class="rounded-2xl bg-destructive/10 px-3 py-2 text-left text-xs text-destructive"
          >
            {{ auth.error }}
          </p>
        </GlassCard>
      </template>
    </section>
  </div>
</template>
