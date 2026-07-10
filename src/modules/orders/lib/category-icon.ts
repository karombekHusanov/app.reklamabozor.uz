import { LayoutGrid, Megaphone, Palette, Printer, Share2, Sparkles } from '@lucide/vue'
import type { Category } from '@/modules/agent/types/agent'

// Categories carry no icon of their own — map to a small set for visual texture.
// Keyed by id so a given category always shows the same icon everywhere.
const ICONS = [Megaphone, Printer, Palette, Share2, LayoutGrid, Sparkles]

export function categoryIcon(category: Category | null | undefined) {
  if (!category) return Sparkles
  return ICONS[category.id % ICONS.length]
}
