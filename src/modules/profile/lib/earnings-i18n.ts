import type { Locale } from '@/core/i18n/messages'
import type { PayoutStatus, PayoutTranche } from '@/modules/profile/types/earnings'

/**
 * Self-contained translations for the earnings / withdrawal screen so we don't
 * bloat the app-wide messages file. Same nested shape per locale.
 */
export interface EarningsStrings {
  title: string
  subtitle: string
  available: string
  /** Same balance, worded for the bank channel (nothing to "withdraw"). */
  owed: string
  processing: string
  paid: string
  withdrawCta: string
  withdrawHint: string
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
  // withdrawal flow
  openForm: string
  formOpened: string
  waitingCard: string
  enterOtp: string
  otpLabel: string
  confirm: string
  cancel: string
  success: string
  failed: string
  noFunds: string
  genericError: string
}

const uz: EarningsStrings = {
  title: 'Daromadlarim',
  subtitle: 'Balans va toʻlovlar tarixi',
  available: 'Yechib olish mumkin',
  owed: 'Oʻtkazish kutilmoqda',
  processing: 'Jarayonda',
  paid: 'Toʻlangan',
  withdrawCta: 'Kartaga yechib olish',
  withdrawHint: 'Uzcard yoki Humo kartangizga oʻtkazamiz',
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
  openForm: 'Karta maʼlumotini kiritish',
  formOpened: 'Karta oynasi ochildi — kartangizni kiriting, keyin “Tekshirish”ni bosing',
  waitingCard: 'Karta kutilmoqda…',
  enterOtp: 'SMS koddi kiriting',
  otpLabel: 'SMS kod',
  confirm: 'Tasdiqlash',
  cancel: 'Bekor qilish',
  success: 'Muvaffaqiyatli oʻtkazildi',
  failed: 'Oʻtkazma amalga oshmadi',
  noFunds: 'Yechib olish uchun mablagʻ yoʻq',
  genericError: 'Xatolik yuz berdi. Qayta urinib koʻring',
}

const ru: EarningsStrings = {
  title: 'Мои доходы',
  subtitle: 'Баланс и история выплат',
  available: 'Доступно к выводу',
  owed: 'Ожидает перевода',
  processing: 'В обработке',
  paid: 'Выплачено',
  withdrawCta: 'Вывести на карту',
  withdrawHint: 'Переведём на вашу карту Uzcard или Humo',
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
  openForm: 'Ввести данные карты',
  formOpened: 'Окно карты открыто — введите карту, затем нажмите «Проверить»',
  waitingCard: 'Ожидание карты…',
  enterOtp: 'Введите SMS-код',
  otpLabel: 'SMS-код',
  confirm: 'Подтвердить',
  cancel: 'Отменить',
  success: 'Успешно переведено',
  failed: 'Перевод не выполнен',
  noFunds: 'Нет средств для вывода',
  genericError: 'Произошла ошибка. Попробуйте снова',
}

const en: EarningsStrings = {
  title: 'My earnings',
  subtitle: 'Balance and payout history',
  available: 'Available to withdraw',
  owed: 'Awaiting transfer',
  processing: 'Processing',
  paid: 'Paid out',
  withdrawCta: 'Withdraw to card',
  withdrawHint: 'We transfer to your Uzcard or Humo card',
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
  openForm: 'Enter card details',
  formOpened: 'Card window opened — enter your card, then tap “Check”',
  waitingCard: 'Waiting for card…',
  enterOtp: 'Enter the SMS code',
  otpLabel: 'SMS code',
  confirm: 'Confirm',
  cancel: 'Cancel',
  success: 'Transferred successfully',
  failed: 'Transfer failed',
  noFunds: 'No funds available to withdraw',
  genericError: 'Something went wrong. Please try again',
}

const TABLE: Record<Locale, EarningsStrings> = { uz, ru, en }

export function earningsStrings(locale: Locale): EarningsStrings {
  return TABLE[locale] ?? en
}
