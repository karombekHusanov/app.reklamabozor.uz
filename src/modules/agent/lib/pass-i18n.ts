import type { Locale } from '@/core/i18n/messages'

/** Self-contained Propusk (agent pass) strings — same shape per locale. */
export interface PassStrings {
  title: string
  active: string
  inactive: string
  free: string
  timeLeft: string
  hoursUnit: string
  minutesUnit: string
  buy: string
  extend: string
  buying: string
  history: string
  historyEmpty: string
  currentBadge: string
  paymentOpened: string
  activatedToast: string
  gatewayUnavailable: string
  genericError: string
  drawerTitle: string
  drawerBody: string
  drawerHint: string
  drawerBuy: string
  drawerChecking: string
  drawerRetryHint: string
  claimLimit: string
  insufficientBalance: string
  paymentUnavailable: string
  needed: string
  unit: string
  perHours: string
  payTitle: string
  payService: string
  payTotal: string
  payCardNumber: string
  payExpiry: string
  payNote: string
  payCta: string
  paySending: string
  payPoweredBy: string
  errCard: string
  errExpiry: string
  otpTitle: string
  otpBody: string
  otpCta: string
  otpChecking: string
  otpChangeCard: string
  otpResend: string
  otpResendIn: string
  successTitle: string
  successBody: string
  successCta: string
  pendingTitle: string
  pendingBody: string
  walletTitle: string
  perOtklik: string
  otkliksLeft: string
  topup: string
  topupTitle: string
  topupAmount: string
  topupService: string
  topupCta: string
  topupSuccessTitle: string
  topupSuccessBody: string
  topupToast: string
  balanceDrawerTitle: string
  balanceDrawerBody: string
  balanceDrawerHint: string
  balanceDrawerCta: string
  otklikCost: string
  otklikPrice: string
  otklikCount: string
}

const uz: PassStrings = {
  title: 'Propusk',
  active: 'Faol',
  inactive: 'Faol emas',
  free: 'Hozircha bepul — Propusk talab qilinmaydi',
  timeLeft: 'Propusk: {h} soat {m} daqiqa qoldi',
  hoursUnit: 'soat',
  minutesUnit: 'daqiqa',
  buy: 'Propusk sotib olish ({price} / {hours} soat)',
  extend: 'Propuskni uzaytirish ({price} / {hours} soat)',
  buying: 'Ochilmoqda...',
  history: 'Propusklar tarixi',
  historyEmpty: 'Hali propusk sotib olinmagan',
  currentBadge: 'Joriy',
  paymentOpened: 'To‘lov sahifasi ochildi. To‘lagach, ilovaga qayting.',
  activatedToast: 'Propusk faollashtirildi',
  gatewayUnavailable: 'To‘lov tizimi hozircha mavjud emas. Keyinroq urinib ko‘ring.',
  genericError: 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.',
  drawerTitle: 'Propusk kerak',
  drawerBody: 'Tezkor so‘rovlarga otklik yuborish uchun faol Propusk kerak. U {hours} soat davomida amal qiladi.',
  drawerHint: 'To‘lovdan so‘ng otklik avtomatik yuboriladi.',
  drawerBuy: 'Sotib olish — {price}',
  drawerChecking: 'To‘lov tekshirilmoqda...',
  drawerRetryHint: 'To‘lab bo‘ldingizmi? Holatni tekshiring.',
  claimLimit: 'Bir vaqtda faol so‘rovlar limiti tugadi. Avval mavjudlarini yakunlang.',
  insufficientBalance: 'Hisobingizda mablag‘ yetarli emas.',
  paymentUnavailable: 'To‘lov manbai mavjud emas. Keyinroq urinib ko‘ring.',
  needed: 'Propusk kerak',
  unit: 'so‘m',
  perHours: 'soat',
  payTitle: "To'lov",
  payService: 'Propusk · {hours} soat',
  payTotal: 'Jami',
  payCardNumber: 'Karta raqami',
  payExpiry: 'Amal qilish muddati',
  payNote: "Karta ma'lumotlari bizda saqlanmaydi — to'lov ATMOS orqali amalga oshiriladi.",
  payCta: "To'lash · {amount}",
  paySending: 'Yuborilmoqda…',
  payPoweredBy: "To'lov tizimi",
  errCard: "Karta raqamini to'liq kiriting",
  errExpiry: "Muddatni OO/YY ko'rinishida kiriting",
  otpTitle: 'SMS kodni kiriting',
  otpBody: "{card} kartasiga bog'langan telefon raqamiga kod yuborildi.",
  otpCta: 'Tasdiqlash',
  otpChecking: 'Tekshirilmoqda…',
  otpChangeCard: 'Boshqa karta',
  otpResend: 'Kodni qayta yuborish',
  otpResendIn: 'Qayta yuborish: {s} s',
  successTitle: "To'lov qabul qilindi",
  successBody: 'Propusk {hours} soatga faollashtirildi.',
  successCta: 'Tayyor',
  pendingTitle: "To'lov tekshirilmoqda",
  pendingBody: 'Bank javobini kutyapmiz — bu bir necha soniya olishi mumkin.',
  walletTitle: 'Balans',
  perOtklik: 'Har bir otklik: {price}',
  otkliksLeft: '≈ {count} ta otklikka yetadi',
  topup: "Balansni to'ldirish",
  topupTitle: "Balansni to'ldirish",
  topupAmount: "Qancha to'ldirasiz?",
  topupService: "Balansni to'ldirish",
  topupCta: "To'ldirish · {amount}",
  topupSuccessTitle: "Balans to'ldirildi",
  topupSuccessBody: 'Balansingiz: {amount}',
  topupToast: "Balans to'ldirildi",
  balanceDrawerTitle: 'Balans yetarli emas',
  balanceDrawerBody: 'Har bir otklik {price} turadi. Balansingiz: {balance}.',
  balanceDrawerHint: "To'ldirgach, otklik avtomatik yuboriladi.",
  balanceDrawerCta: "Balansni to'ldirish",
  otklikCost: 'Balansdan {price} yechiladi · qoladi {left}',
  otklikPrice: 'Otklik narxi',
  otklikCount: '≈ {count} ta otklik',
}

const ru: PassStrings = {
  title: 'Пропуск',
  active: 'Активен',
  inactive: 'Не активен',
  free: 'Пока бесплатно — Пропуск не требуется',
  timeLeft: 'Пропуск: осталось {h} ч {m} мин',
  hoursUnit: 'ч',
  minutesUnit: 'мин',
  buy: 'Купить Пропуск ({price} / {hours} ч)',
  extend: 'Продлить Пропуск ({price} / {hours} ч)',
  buying: 'Открываем...',
  history: 'История Пропусков',
  historyEmpty: 'Пропуски ещё не покупались',
  currentBadge: 'Текущий',
  paymentOpened: 'Страница оплаты открыта. После оплаты вернитесь в приложение.',
  activatedToast: 'Пропуск активирован',
  gatewayUnavailable: 'Платёжная система пока недоступна. Попробуйте позже.',
  genericError: 'Не удалось выполнить действие. Попробуйте ещё раз.',
  drawerTitle: 'Нужен Пропуск',
  drawerBody: 'Чтобы откликаться на срочные заявки, нужен активный Пропуск. Он действует {hours} ч.',
  drawerHint: 'После оплаты отклик отправится автоматически.',
  drawerBuy: 'Купить — {price}',
  drawerChecking: 'Проверяем оплату...',
  drawerRetryHint: 'Уже оплатили? Проверьте статус.',
  claimLimit: 'Достигнут лимит активных заявок. Сначала завершите текущие.',
  insufficientBalance: 'Недостаточно средств на балансе.',
  paymentUnavailable: 'Источник оплаты недоступен. Попробуйте позже.',
  needed: 'Нужен Пропуск',
  unit: 'сум',
  perHours: 'ч',
  payTitle: 'Оплата',
  payService: 'Пропуск · {hours} ч',
  payTotal: 'Итого',
  payCardNumber: 'Номер карты',
  payExpiry: 'Срок действия',
  payNote: 'Мы не храним данные карты — оплата проходит через ATMOS.',
  payCta: 'Оплатить · {amount}',
  paySending: 'Отправляем…',
  payPoweredBy: 'Платёжная система',
  errCard: 'Введите номер карты полностью',
  errExpiry: 'Введите срок в формате ММ/ГГ',
  otpTitle: 'Введите код из SMS',
  otpBody: 'Код отправлен на номер, привязанный к карте {card}.',
  otpCta: 'Подтвердить',
  otpChecking: 'Проверяем…',
  otpChangeCard: 'Другая карта',
  otpResend: 'Отправить код ещё раз',
  otpResendIn: 'Повторно через {s} с',
  successTitle: 'Оплата прошла',
  successBody: 'Пропуск активирован на {hours} ч.',
  successCta: 'Готово',
  pendingTitle: 'Проверяем оплату',
  pendingBody: 'Ждём ответа банка — это может занять несколько секунд.',
  walletTitle: 'Баланс',
  perOtklik: 'Каждый отклик: {price}',
  otkliksLeft: 'Хватит примерно на {count} откликов',
  topup: 'Пополнить баланс',
  topupTitle: 'Пополнение баланса',
  topupAmount: 'Сумма пополнения',
  topupService: 'Пополнение баланса',
  topupCta: 'Пополнить · {amount}',
  topupSuccessTitle: 'Баланс пополнен',
  topupSuccessBody: 'Ваш баланс: {amount}',
  topupToast: 'Баланс пополнен',
  balanceDrawerTitle: 'Недостаточно средств',
  balanceDrawerBody: 'Каждый отклик стоит {price}. Ваш баланс: {balance}.',
  balanceDrawerHint: 'После пополнения отклик отправится автоматически.',
  balanceDrawerCta: 'Пополнить баланс',
  otklikCost: 'С баланса спишется {price} · останется {left}',
  otklikPrice: 'Цена отклика',
  otklikCount: '≈ {count} откликов',
}

const en: PassStrings = {
  title: 'Propusk',
  active: 'Active',
  inactive: 'Inactive',
  free: 'Free for now — no Propusk required',
  timeLeft: 'Propusk: {h} h {m} min left',
  hoursUnit: 'h',
  minutesUnit: 'min',
  buy: 'Buy Propusk ({price} / {hours} h)',
  extend: 'Extend Propusk ({price} / {hours} h)',
  buying: 'Opening...',
  history: 'Propusk history',
  historyEmpty: 'No Propusk purchased yet',
  currentBadge: 'Current',
  paymentOpened: 'Payment page opened. Return to the app after paying.',
  activatedToast: 'Propusk activated',
  gatewayUnavailable: 'Payments are unavailable right now. Please try later.',
  genericError: 'Could not complete the action. Please try again.',
  drawerTitle: 'Propusk required',
  drawerBody: 'You need an active Propusk to respond to Tezkor requests. It lasts {hours} hours.',
  drawerHint: 'Your response is sent automatically after payment.',
  drawerBuy: 'Buy — {price}',
  drawerChecking: 'Checking payment...',
  drawerRetryHint: 'Already paid? Check the status.',
  claimLimit: 'You reached the limit of active requests. Finish current ones first.',
  insufficientBalance: 'Insufficient balance.',
  paymentUnavailable: 'Payment source is unavailable. Please try later.',
  needed: 'Propusk required',
  unit: 'UZS',
  perHours: 'h',
  payTitle: 'Payment',
  payService: 'Propusk · {hours} h',
  payTotal: 'Total',
  payCardNumber: 'Card number',
  payExpiry: 'Expiry date',
  payNote: "We don't store your card details — the payment is processed by ATMOS.",
  payCta: 'Pay · {amount}',
  paySending: 'Sending…',
  payPoweredBy: 'Payments by',
  errCard: 'Enter the full card number',
  errExpiry: 'Enter the expiry as MM/YY',
  otpTitle: 'Enter the SMS code',
  otpBody: 'We sent a code to the phone linked to {card}.',
  otpCta: 'Confirm',
  otpChecking: 'Checking…',
  otpChangeCard: 'Use another card',
  otpResend: 'Resend code',
  otpResendIn: 'Resend in {s} s',
  successTitle: 'Payment successful',
  successBody: 'Your Propusk is active for {hours} hours.',
  successCta: 'Done',
  pendingTitle: 'Checking the payment',
  pendingBody: 'Waiting for the bank — this can take a few seconds.',
  walletTitle: 'Balance',
  perOtklik: 'Each response: {price}',
  otkliksLeft: 'Enough for about {count} responses',
  topup: 'Top up balance',
  topupTitle: 'Top up balance',
  topupAmount: 'How much to add?',
  topupService: 'Balance top-up',
  topupCta: 'Top up · {amount}',
  topupSuccessTitle: 'Balance topped up',
  topupSuccessBody: 'Your balance: {amount}',
  topupToast: 'Balance topped up',
  balanceDrawerTitle: 'Not enough balance',
  balanceDrawerBody: 'Each response costs {price}. Your balance: {balance}.',
  balanceDrawerHint: 'Your response is sent automatically after you top up.',
  balanceDrawerCta: 'Top up balance',
  otklikCost: '{price} from your balance · {left} left',
  otklikPrice: 'Response price',
  otklikCount: '≈ {count} responses',
}

const all: Record<Locale, PassStrings> = { uz, ru, en }

export function passStrings(locale: Locale): PassStrings {
  return all[locale]
}

export function fmtSom(n: number, unit: string): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(n))} ${unit}`
}
