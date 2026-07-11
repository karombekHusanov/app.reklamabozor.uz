import type { Category } from '@/modules/agent/types/agent'

export interface CategoryAccent {
  tile: string
  icon: string
  glow: string
}

const ACCENTS: CategoryAccent[] = [
  {
    tile: 'border-primary/20 bg-primary/5',
    icon: 'border-primary/25 bg-primary/10 text-primary',
    glow: 'from-primary/15',
  },
  {
    tile: 'border-teal-500/20 bg-teal-500/6',
    icon: 'border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-300',
    glow: 'from-teal-500/15',
  },
  {
    tile: 'border-amber-500/20 bg-amber-500/6',
    icon: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300',
    glow: 'from-amber-500/15',
  },
  {
    tile: 'border-violet-500/20 bg-violet-500/6',
    icon: 'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-300',
    glow: 'from-violet-500/15',
  },
  {
    tile: 'border-rose-500/20 bg-rose-500/6',
    icon: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300',
    glow: 'from-rose-500/15',
  },
  {
    tile: 'border-sky-500/20 bg-sky-500/6',
    icon: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-300',
    glow: 'from-sky-500/15',
  },
]

export function categoryAccent(category: Category, index = 0): CategoryAccent {
  return ACCENTS[(category.id + index) % ACCENTS.length]
}

export type CategoryLayoutMode = 'empty' | 'solo' | 'pair' | 'trio' | 'grid' | 'cloud'

export function categoryLayoutMode(count: number): CategoryLayoutMode {
  if (count === 0) return 'empty'
  if (count === 1) return 'solo'
  if (count === 2) return 'pair'
  if (count === 3) return 'trio'
  if (count <= 6) return 'grid'
  return 'cloud'
}

export function portfolioBentoClass(index: number, total: number): string {
  if (total === 1) return 'agent-portfolio-bento__item--solo'
  if (total === 2) return 'agent-portfolio-bento__item--duo'
  if (index === 0) return 'agent-portfolio-bento__item--hero'
  if (index % 4 === 3) return 'agent-portfolio-bento__item--wide'
  return 'agent-portfolio-bento__item--tile'
}
