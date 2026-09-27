import { Banknote, Search, Star, UserRound, Wallet, Zap } from '@lucide/vue'
import type { Component } from 'vue'
import { ROUTES } from '@/modules/shell/constants/routes'

export type AgentStoryId = 'how' | 'first' | 'balance' | 'profile' | 'rating' | 'payout'

export interface AgentStoryDef {
  id: AgentStoryId
  icon: Component
  /** Artwork gradient (decorative, not a UI token). */
  bg: string
  /** Where the story CTA leads; `null` just closes the viewer. */
  to: string | null
}

/** Onboarding stories on the agent home. Copy lives in i18n `agentHome.stories.<id>`. */
export const AGENT_STORIES: AgentStoryDef[] = [
  { id: 'how', icon: Search, bg: 'linear-gradient(160deg, #0b6bcb 0%, #02305c 100%)', to: null },
  { id: 'first', icon: Zap, bg: 'linear-gradient(160deg, #f26b21 0%, #b83a0c 100%)', to: null },
  { id: 'balance', icon: Wallet, bg: 'linear-gradient(160deg, #0f9f6e 0%, #075c43 100%)', to: ROUTES.agentBalance },
  { id: 'profile', icon: UserRound, bg: 'linear-gradient(160deg, #7c4ddb 0%, #3f1f93 100%)', to: ROUTES.profileEdit },
  { id: 'rating', icon: Star, bg: 'linear-gradient(160deg, #f5a524 0%, #b36b00 100%)', to: ROUTES.agentProfile },
  { id: 'payout', icon: Banknote, bg: 'linear-gradient(160deg, #0ea5c6 0%, #03516b 100%)', to: ROUTES.earnings },
]
