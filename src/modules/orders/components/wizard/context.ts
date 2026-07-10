import type { InjectionKey } from 'vue'
import type { Category } from '@/modules/agent/types/agent'
import type { OrderDraft } from '@/modules/orders/types/order'

/**
 * Shared state for the order wizard. Provided by `OrderWizard.vue` and injected
 * by each step so the steps can read + mutate the same reactive draft without a
 * long prop/emit chain (and without tripping `vue/no-mutating-props`).
 */
export interface WizardContext {
  draft: OrderDraft
  errors: Record<string, string>
  categories: Category[]
}

export const WIZARD_KEY: InjectionKey<WizardContext> = Symbol('order-wizard')
