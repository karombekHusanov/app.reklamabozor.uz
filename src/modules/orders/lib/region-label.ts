import type { Locale } from '@/core/i18n/messages'
import { regionName } from '@/core/i18n/region-name'
import type { OrderRegionRef } from '@/modules/orders/types/region'

/** Human-readable region ± district label, or null when unset (all Uzbekistan). */
export function formatOrderRegion(
  order: { region?: OrderRegionRef | null, district?: OrderRegionRef | null },
  locale: Locale,
): string | null {
  if (!order.region) return null
  const regionLabel = regionName(order.region, locale)
  if (order.district) {
    return `${regionName(order.district, locale)}, ${regionLabel}`
  }
  return regionLabel
}
