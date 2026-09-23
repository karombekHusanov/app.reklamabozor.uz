import {
  Bus,
  CircleHelp,
  Clapperboard,
  Gem,
  Image,
  LayoutGrid,
  Megaphone,
  MonitorSmartphone,
  Palette,
  PenTool,
  Printer,
  Radio,
  Send,
  Share2,
  Signpost,
  Sparkles,
  Tv,
  UsersRound,
} from '@lucide/vue'
import type { Category } from '@/modules/agent/types/agent'

/**
 * Categories carry no icon of their own. Match the name (uz + ru) against the
 * service it describes; unknown names fall back to a fixed-by-id icon so a
 * given category always shows the same one everywhere. First match wins —
 * specific words come before generic ones ("banner dizayn" → banner).
 */
const KEYWORDS: [RegExp, typeof Megaphone][] = [
  [/logo|логот/i, PenTool],
  [/brend|бренд/i, Gem],
  [/motion|моушн|анимац/i, Clapperboard],
  [/banner|баннер/i, Image],
  [/tashqi|наруж|билборд|bilbord/i, Signpost],
  [/transport|транспорт/i, Bus],
  [/telegram|телеграм/i, Send],
  [/influenc|блогер|инфлюенс/i, UsersRound],
  [/televid|телевид|\btv\b/i, Tv],
  [/radio|радио/i, Radio],
  [/bosma|poligraf|печат|полиграф/i, Printer],
  [/smm|ijtimoiy|соцсет|social/i, Share2],
  [/raqamli|цифров|digital|onlayn|онлайн/i, MonitorSmartphone],
  [/dizayn|дизайн/i, Palette],
]

const FALLBACK = [Megaphone, Printer, Palette, Share2, LayoutGrid, Sparkles]

export function categoryIcon(category: Category | null | undefined) {
  if (!category) return Sparkles
  if (category.is_other) return CircleHelp
  const name = `${category.name_uz} ${category.name_ru}`
  for (const [pattern, icon] of KEYWORDS) {
    if (pattern.test(name)) return icon
  }
  return FALLBACK[category.id % FALLBACK.length]
}
