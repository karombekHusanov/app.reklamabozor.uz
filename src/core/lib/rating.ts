import type { RatingInfo, UserRatingRow } from '@/modules/orders/types/order'

type GradeLabels = {
  high: string
  normal: string
  low: string
  weak: string
}

export function gradeLabelForScore(grade: number, labels: GradeLabels): string {
  if (grade >= 80) return labels.high
  if (grade >= 60) return labels.normal
  if (grade >= 40) return labels.low
  return labels.weak
}

export function mapUserRatingRow(row: UserRatingRow): RatingInfo {
  const stars = row.stars ?? row.rating_avg ?? 5
  const starsCount = row.stars_count ?? row.rating_count ?? 0
  const grade = row.grade ?? 50

  return {
    stars: Number(stars),
    stars_count: Number(starsCount),
    grade: Number(grade),
  }
}

export function pickUserRatingRow(rows: UserRatingRow[], role?: string): UserRatingRow | null {
  if (!rows.length) return null
  if (role) {
    return rows.find(row => row.role === role) ?? rows[0] ?? null
  }
  return rows[0] ?? null
}
