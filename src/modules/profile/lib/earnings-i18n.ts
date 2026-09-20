import type { Locale } from '@/core/i18n/messages'
import type { PayoutStatus, PayoutTranche } from '@/modules/profile/types/earnings'

/**
 * Self-contained translations for the earnings screen so we don't
 * bloat the app-wide messages file. Same nested shape per locale.
 */
export interface EarningsStrings {
  title: string
  subtitle: string
  owed: string
  processing: string
  paid: string
  // bank destination (the default channel: a manager transfers the money)
  bankTitle: string
  bankHint: string
  bankAccount: string
  bankMfo: string
  bankMissing: string
  bankMissingCta: string
  history: string
  empty: string
  emptyHint: string
  tranche: Record<PayoutTranche, string>
  status: Record<PayoutStatus, string>
  genericError: string
}

const uz: EarningsStrings = {
  title: 'Daromadlarim',
  subtitle: 'Balans va toʻlovlar tarixi',
  owed: 'Oʻtkazish kutilmoqda',
  processing: 'Jarayonda',
  paid: 'Toʻlangan',
  bankTitle: 'Bank hisobingizga oʻtkaziladi',
  bankHint: 'Mijoz toʻlagach, ish bosqichiga qarab hisobingizga oʻtkazamiz',
  bankAccount: 'Hisob raqam',
  bankMfo: 'MFO',
  bankMissing: 'Bank rekvizitlaringiz toʻliq emas — oʻtkazma amalga oshmaydi',
  bankMissingCta: 'Menejerga murojaat qiling',
  history: 'Toʻlovlar tarixi',
  empty: 'Hali toʻlov yoʻq',
  emptyHint: 'Buyurtmalar yakunlangach shu yerda koʻrinadi',
  tranche: { advance: 'Boshlangʻich (avans)', final: 'Yakuniy', adjustment: 'Tuzatish' },
  status: {
    pending: 'Kutilmoqda', processing: 'Jarayonda', paid: 'Toʻlangan',
    failed: 'Xatolik', cancelled: 'Bekor qilingan',
  },
  genericError: 'Xatolik yuz berdi. Qayta urinib koʻring',
}

const ru: EarningsStrings = {
  title: 'Мои доходы',
  subtitle: 'Баланс и история выплат',
  owed: 'Ожидает перевода',
  processing: 'В обработке',
  paid: 'Выплачено',
  bankTitle: 'Переведём на ваш банковский счёт',
  bankHint: 'После оплаты клиентом переводим по этапам работы',
  bankAccount: 'Расчётный счёт',
  bankMfo: 'МФО',
  bankMissing: 'Банковские реквизиты неполные — перевод невозможен',
  bankMissingCta: 'Обратитесь к менеджеру',
  history: 'История выплат',
  empty: 'Выплат пока нет',
  emptyHint: 'Появятся здесь после завершения заказов',
  tranche: { advance: 'Аванс', final: 'Итоговая', adjustment: 'Корректировка' },
  status: {
    pending: 'Ожидает', processing: 'В обработке', paid: 'Выплачено',
    failed: 'Ошибка', cancelled: 'Отменено',
  },
  genericError: 'Произошла ошибка. Попробуйте снова',
}

const en: EarningsStrings = {
  title: 'My earnings',
  subtitle: 'Balance and payout history',
  owed: 'Awaiting transfer',
  processing: 'Processing',
  paid: 'Paid out',
  bankTitle: 'Paid to your bank account',
  bankHint: 'Once the client pays, we transfer it as the work progresses',
  bankAccount: 'Account',
  bankMfo: 'MFO',
  bankMissing: 'Your bank requisites are incomplete — the transfer cannot be made',
  bankMissingCta: 'Contact your manager',
  history: 'Payout history',
  empty: 'No payouts yet',
  emptyHint: 'They appear here once orders are completed',
  tranche: { advance: 'Advance', final: 'Final', adjustment: 'Adjustment' },
  status: {
    pending: 'Pending', processing: 'Processing', paid: 'Paid',
    failed: 'Failed', cancelled: 'Cancelled',
  },
  genericError: 'Something went wrong. Please try again',
}

const TABLE: Record<Locale, EarningsStrings> = { uz, ru, en }

export function earningsStrings(locale: Locale): EarningsStrings {
  return TABLE[locale] ?? en
}
