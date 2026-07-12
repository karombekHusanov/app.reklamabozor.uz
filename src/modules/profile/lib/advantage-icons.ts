import {
  BadgePercent,
  CalendarCheck,
  FileCheck,
  Headphones,
  MapPin,
  PenTool,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Truck,
  Users,
} from '@lucide/vue'
import type { Component } from 'vue'

/**
 * Lucide components for the advantage-catalog icon keys the backend stores.
 * Unknown keys fall back to a sparkle so a new catalog entry never breaks the UI.
 */
const ICONS: Record<string, Component> = {
  'timer': Timer,
  'shield-check': ShieldCheck,
  'pen-tool': PenTool,
  'truck': Truck,
  'badge-percent': BadgePercent,
  'users': Users,
  'map-pin': MapPin,
  'file-check': FileCheck,
  'headphones': Headphones,
  'sparkles': Sparkles,
  'calendar-check': CalendarCheck,
  'refresh-ccw': RefreshCcw,
}

export const ADVANTAGE_ICON_KEYS = Object.keys(ICONS)

export function advantageIcon(key: string): Component {
  return ICONS[key] ?? Sparkles
}
