<script setup lang="ts">
import {
  ClipboardList,
  Inbox,
  Loader2,
  LogOut,
  PencilLine,
  Phone,
  Plus,
  ShieldCheck,
} from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { useTelegram } from '@/core/composables/useTelegram'
import AgentApplicationForm from '@/modules/agent/components/AgentApplicationForm.vue'
import AgentDetailsForm from '@/modules/agent/components/AgentDetailsForm.vue'
import AgentOrdersSection from '@/modules/agent/components/AgentOrdersSection.vue'
import AgentStatusCard from '@/modules/agent/components/AgentStatusCard.vue'
import OrderCard from '@/modules/orders/components/OrderCard.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useAgentStore } from '@/modules/agent/stores/agent.store'
import { useOrdersStore } from '@/modules/orders/stores/orders.store'
import { useLocaleStore } from '@/core/i18n/locale.store'
import { useToast } from '@/core/composables/useToast'
import { formatDate } from '@/core/lib/date'
import { ROUTES } from '@/modules/shell/constants/routes'
import { fullName, isBusinessUser } from '@/modules/auth/types/user'
import type { AgentApplicationPayload, AgentDetailsPayload } from '@/modules/agent/types/agent'

const auth = useAuthStore()
const agent = useAgentStore()
const orders = useOrdersStore()
const router = useRouter()
const route = useRoute()
const locale = useLocaleStore()
const toast = useToast()
const { haptic } = useTelegram()

const user = computed(() => auth.user)
const displayName = computed(() => (user.value ? fullName(user.value) : ''))
const isAgent = computed(() => agent.isApproved)
/** Agents/designers/sellers get the agency (KYC + presentation) section; clients don't. */
const isProvider = computed(() => (user.value ? isBusinessUser(user.value) : false))

const memberSince = computed(() => (user.value ? formatDate(user.value.created_at, locale.locale) : ''))

// --- Tabs (offers is only relevant — and only shown — to provider accounts) ---
type Tab = 'profile' | 'orders' | 'offers'
const activeTab = ref<Tab>('profile')

const tabs = computed(() => {
  const list: { id: Tab, label: string }[] = [
    { id: 'profile', label: locale.t.profile.tabProfile },
    { id: 'orders', label: locale.t.profile.tabOrders },
  ]
  if (isProvider.value) list.push({ id: 'offers', label: locale.t.profile.tabOffers })
  return list
})

function tabClass(tab: Tab) {
  return cn(
    'relative z-10 shrink-0 rounded-xl px-4 py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-300',
    activeTab.value === tab
      ? 'text-primary dark:text-foreground'
      : 'text-muted-foreground',
  )
}

// --- Sliding "liquid" active-tab pill ---
const tabButtons = ref<HTMLElement[]>([])
const thumbStyle = ref({ transform: 'translateX(0px)', width: '0px' })
const thumbReady = ref(false)

function setTabButtonRef(el: Element | null, index: number) {
  if (el) tabButtons.value[index] = el as HTMLElement
}

function updateThumb() {
  const index = tabs.value.findIndex(t => t.id === activeTab.value)
  const el = tabButtons.value[index]
  if (!el) return
  thumbStyle.value = {
    transform: `translateX(${el.offsetLeft}px)`,
    width: `${el.offsetWidth}px`,
  }
  // Bring the active tab into view when the row scrolls (e.g. a deep link to "offers").
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

watch([activeTab, tabs], () => nextTick(updateThumb))

function handleResize() {
  updateThumb()
}

onMounted(async () => {
  await nextTick()
  updateThumb()
  // Snap into place on first paint, then let the pill glide for every tab after that.
  requestAnimationFrame(() => { thumbReady.value = true })
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// Deep-link target: /profile?tab=offers&order=123 focuses that order for a provider.
const focusOrderId = computed(() => {
  const raw = Array.isArray(route.query.order) ? route.query.order[0] : route.query.order
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

// A client can never land on "offers" — fall back if the role turns out not to qualify.
watch(isProvider, (canSeeOffers) => {
  if (!canSeeOffers && activeTab.value === 'offers') activeTab.value = 'profile'
})

async function load() {
  if (!auth.isAuthenticated) return
  await Promise.all([agent.loadProfile(), agent.loadCategories(), orders.loadMyOrders()])
}

async function handleAvatarChange(fileId: number | null) {
  await auth.saveAvatar(fileId)
}

// --- Profile edit (name only — phone comes from Telegram and is read-only) ---
const editing = ref(false)
const savingProfile = ref(false)
const editForm = reactive({ first_name: '', last_name: '' })

function startEdit() {
  editForm.first_name = user.value?.first_name ?? ''
  editForm.last_name = user.value?.last_name ?? ''
  editing.value = true
}

async function saveProfile() {
  if (editForm.first_name.trim() === '') {
    toast.error(locale.t.profile.errName)
    return
  }
  savingProfile.value = true
  const ok = await auth.updateProfile({
    first_name: editForm.first_name.trim(),
    last_name: editForm.last_name.trim() || null,
  })
  savingProfile.value = false

  if (ok) {
    editing.value = false
    toast.success(locale.t.profile.savedToast)
  }
  else if (auth.error) {
    toast.error(auth.error)
  }
}

// --- Agency KYC / presentation (providers only) ---
const editingAgency = ref(false)
const showAgencyForm = computed(() => agent.canApply || editingAgency.value)

function startEditingAgency() {
  haptic('light')
  editingAgency.value = true
}

async function handleSubmit(payload: AgentApplicationPayload) {
  haptic('light')
  const ok = await agent.submit(payload)

  if (ok) {
    editingAgency.value = false
    haptic('medium')
    toast.success(locale.t.agent.submittedToast)
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}

async function handleSaveDetails(payload: AgentDetailsPayload) {
  haptic('light')
  const ok = await agent.submitDetails(payload)
  if (ok) {
    haptic('medium')
    toast.success(locale.t.agent.savedToast)
  }
  else if (agent.error) {
    toast.error(agent.error)
  }
}

onMounted(() => {
  const q = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  if (q === 'offers' || q === 'orders') activeTab.value = q
  void load()
})
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
</script>

<template>
  <div>
    <AppHeader
      :title="locale.t.profile.title"
      :subtitle="isAgent ? locale.t.profile.subtitleAgent : locale.t.profile.subtitleUser"
      show-back
    />

    <section class="space-y-5 px-5">
      <template v-if="auth.isAuthenticated && user">
        <!-- Tabs -->
        <div class="glass-segment flex gap-1 overflow-x-auto rounded-2xl p-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <div
            class="glass-segment-active"
            :class="{ 'no-anim': !thumbReady }"
            :style="thumbStyle"
          />
          <button
            v-for="(tab, index) in tabs"
            :key="tab.id"
            :ref="(el) => setTabButtonRef(el as Element | null, index)"
            type="button"
            :class="tabClass(tab.id)"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- ============ PROFILE INFO TAB ============ -->
        <template v-if="activeTab === 'profile'">
          <!-- Identity -->
          <GlassCard class="relative flex items-center gap-4">
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
              <p
                v-if="user.username"
                class="truncate text-sm text-muted-foreground"
              >
                @{{ user.username }}
              </p>
              <div class="mt-3">
                <Badge
                  :variant="isAgent ? 'success' : 'primary'"
                  class="uppercase"
                >
                  {{ isAgent ? locale.t.roles.agent : locale.t.roles[user.role] }}
                </Badge>
              </div>
            </div>
            <button
              v-if="!editing"
              type="button"
              class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition active:scale-95"
              :aria-label="locale.t.profile.editProfile"
              @click="startEdit"
            >
              <PencilLine class="size-4" />
            </button>
          </GlassCard>

          <!-- Edit profile (name only — phone is not editable) -->
          <GlassCard
            v-if="editing"
            class="space-y-4"
          >
            <p class="text-sm font-semibold">
              {{ locale.t.profile.editProfile }}
            </p>

            <div class="space-y-1.5">
              <label
                class="text-sm font-medium"
                for="first_name"
              >{{ locale.t.profile.firstName }}</label>
              <input
                id="first_name"
                v-model="editForm.first_name"
                type="text"
                class="glass-input"
              >
            </div>

            <div class="space-y-1.5">
              <label
                class="text-sm font-medium"
                for="last_name"
              >{{ locale.t.profile.lastName }}</label>
              <input
                id="last_name"
                v-model="editForm.last_name"
                type="text"
                class="glass-input"
              >
            </div>

            <div class="space-y-1.5">
              <label class="text-sm font-medium">{{ locale.t.profile.phone }}</label>
              <input
                :value="user.phone ?? locale.t.common.notAdded"
                type="text"
                disabled
                class="glass-input cursor-not-allowed opacity-60"
              >
              <p class="text-xs text-muted-foreground">
                {{ locale.t.profile.phoneReadonly }}
              </p>
            </div>

            <div class="flex gap-2 pt-1">
              <Button
                class="h-11 flex-1 rounded-2xl"
                :disabled="savingProfile"
                @click="saveProfile"
              >
                <Loader2
                  v-if="savingProfile"
                  class="size-4 animate-spin"
                />
                {{ savingProfile ? locale.t.profile.saving : locale.t.profile.save }}
              </Button>
              <Button
                variant="outline"
                class="h-11 rounded-2xl"
                :disabled="savingProfile"
                @click="editing = false"
              >
                {{ locale.t.profile.cancel }}
              </Button>
            </div>
          </GlassCard>

          <!-- Contact -->
          <GlassCard
            v-else
            class="flex items-center gap-3"
          >
            <Phone class="size-5 shrink-0 text-primary" />
            <div class="min-w-0">
              <p class="text-sm text-muted-foreground">
                {{ locale.t.profile.phone }}
              </p>
              <p class="font-medium">
                {{ user.phone ?? locale.t.common.notAdded }}
              </p>
            </div>
          </GlassCard>

          <!-- Agency info (agent/designer/seller only — this IS the agency's profile page) -->
          <template v-if="isProvider">
            <!-- Intro (no application yet) -->
            <GlassCard
              v-if="!agent.hasProfile"
              class="space-y-3"
            >
              <Badge variant="primary">
                {{ locale.t.agent.b2bBadge }}
              </Badge>
              <h2 class="text-xl font-semibold">
                {{ locale.t.agent.introTitle }}
              </h2>
              <p class="text-sm leading-relaxed text-muted-foreground">
                {{ locale.t.agent.introBody }}
              </p>
              <div class="flex items-start gap-3 rounded-2xl bg-muted p-4 dark:bg-white/5">
                <ShieldCheck class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="font-medium">
                    {{ locale.t.agent.verifiedBadgeTitle }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ locale.t.agent.verifiedBadgeBody }}
                  </p>
                </div>
              </div>
            </GlassCard>

            <!-- Status (has an application) -->
            <AgentStatusCard
              v-if="agent.profile"
              :profile="agent.profile"
            />

            <!-- Approved → presentation editor -->
            <template v-if="agent.isApproved && agent.profile">
              <div class="flex items-center justify-between px-1">
                <h3 class="text-base font-semibold text-white">
                  {{ locale.t.agent.publicProfile }}
                </h3>
                <span class="text-xs text-white/70">{{ locale.t.agent.shownToClients }}</span>
              </div>
              <AgentDetailsForm
                :profile="agent.profile"
                :categories="agent.categories"
                :saving="agent.isSavingDetails"
                @save="handleSaveDetails"
              />
            </template>

            <!-- Edit / resubmit affordance for pending or rejected -->
            <Button
              v-if="agent.hasProfile && !agent.isApproved && !showAgencyForm"
              variant="outline"
              class="h-11 w-full rounded-2xl"
              @click="startEditingAgency"
            >
              <PencilLine class="size-4" />
              {{ agent.isRejected ? locale.t.agent.updateResubmit : locale.t.agent.editApplication }}
            </Button>

            <!-- The KYC application form -->
            <AgentApplicationForm
              v-if="showAgencyForm"
              :initial="agent.profile"
              :submitting="agent.isSubmitting"
              @submit="handleSubmit"
            />

            <p
              v-if="agent.error"
              class="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {{ agent.error }}
            </p>
          </template>

          <GlassCard>
            <p class="text-sm text-muted-foreground">
              {{ locale.t.profile.memberSince }}
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
            {{ locale.t.profile.signOut }}
          </Button>
        </template>

        <!-- ============ MY ORDERS TAB ============ -->
        <template v-else-if="activeTab === 'orders'">
          <template v-if="orders.isLoading && orders.myOrders.length === 0">
            <Skeleton
              v-for="n in 3"
              :key="n"
              class="h-28 w-full rounded-3xl"
            />
          </template>

          <GlassCard
            v-else-if="orders.myOrders.length === 0"
            padding="none"
            class="overflow-hidden"
          >
            <EmptyState
              :icon="ClipboardList"
              :title="locale.t.orders.emptyTitle"
              :description="locale.t.orders.emptyBody"
            >
              <Button
                class="mt-1 rounded-2xl"
                @click="router.push(ROUTES.newOrder)"
              >
                <Plus class="size-4" />
                {{ locale.t.orders.newRequest }}
              </Button>
            </EmptyState>
          </GlassCard>

          <template v-else>
            <Button
              class="h-11 w-full rounded-2xl"
              @click="router.push(ROUTES.newOrder)"
            >
              <Plus class="size-4" />
              {{ locale.t.orders.newRequest }}
            </Button>
            <OrderCard
              v-for="order in orders.myOrders"
              :key="order.id"
              :order="order"
              @open="openOrder(order.id)"
            />
          </template>
        </template>

        <!-- ============ MY OFFERS TAB (providers only) ============ -->
        <template v-else-if="isProvider">
          <AgentOrdersSection
            v-if="agent.isApproved && agent.profile"
            :focus-order-id="focusOrderId"
          />

          <GlassCard
            v-else
            padding="none"
            class="overflow-hidden"
          >
            <EmptyState
              :icon="Inbox"
              :title="locale.t.profile.offersLockedTitle"
              :description="locale.t.profile.offersLockedBody"
            >
              <Button
                class="mt-1 rounded-2xl"
                @click="activeTab = 'profile'"
              >
                {{ locale.t.profile.completeProfile }}
              </Button>
            </EmptyState>
          </GlassCard>
        </template>
      </template>

      <!-- ============ GUEST ============ -->
      <template v-else>
        <GlassCard class="space-y-4 text-center">
          <Avatar
            name="Guest"
            size="lg"
            class="mx-auto"
          />
          <div class="space-y-2">
            <h2 class="text-xl font-semibold">
              {{ locale.t.profile.guestTitle }}
            </h2>
            <p class="text-sm leading-relaxed text-muted-foreground">
              {{ locale.t.profile.guestBody }}
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
