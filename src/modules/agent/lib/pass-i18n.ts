import type { Locale } from '@/core/i18n/messages'

/** Self-contained per-order fee / wallet strings — same shape per locale. */
export interface PassStrings {
  free: string
  gatewayUnavailable: string
  genericError: string
  paymentUnavailable: string
  unit: string
  payTotal: string
  payCardNumber: string
  payExpiry: string
  payNote: string
  paySending: string
  payPoweredBy: string
  errCard: string
  errExpiry: string
  otpTitle: string
  otpBody: string
  otpCta: string
  otpChecking: string
  otpChangeCard: string
  savedCards: string
  newCard: string
  saveCard: string
  saveCardHint: string
  removeCard: string
  removeCardConfirm: string
  otpResend: string
  otpResendIn: string
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
  freeOtklik: string
  takeTitle: string
  takeBody: string
  takeBodyFree: string
  takeLeft: string
  takeCta: string
  takeCtaFree: string
  takeDecline: string
  takeDeclineTitle: string
  takeDeclineBody: string
  takeDone: string
  takeExpired: string
}

const uz: PassStrings = {
  free: "Hozircha bepul — buyurtmalar uchun to'lov olinmaydi",
  gatewayUnavailable: 'To‘lov tizimi hozircha mavjud emas. Keyinroq urinib ko‘ring.',
  genericError: 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.',
  paymentUnavailable: 'To‘lov manbai mavjud emas. Keyinroq urinib ko‘ring.',
  unit: 'so‘m',
  payTotal: 'Jami',
  payCardNumber: 'Karta raqami',
  payExpiry: 'Amal qilish muddati',
  payNote: "Karta ma'lumotlari bizda saqlanmaydi — to'lov ATMOS orqali amalga oshiriladi.",
  paySending: 'Yuborilmoqda…',
  payPoweredBy: "To'lov tizimi",
  errCard: "Karta raqamini to'liq kiriting",
  errExpiry: "Muddatni OO/YY ko'rinishida kiriting",
  otpTitle: 'SMS kodni kiriting',
  otpBody: "{card} kartasiga bog'langan telefon raqamiga kod yuborildi.",
  otpCta: 'Tasdiqlash',
  otpChecking: 'Tekshirilmoqda…',
  otpChangeCard: 'Boshqa karta',
  savedCards: 'Saqlangan kartalar',
  newCard: 'Yangi karta',
  saveCard: 'Kartani saqlash',
  saveCardHint: "Keyingi safar karta raqami va SMS kodsiz to'lanadi.",
  removeCard: "O'chirish",
  removeCardConfirm: "O'chirilsinmi?",
  otpResend: 'Kodni qayta yuborish',
  otpResendIn: 'Qayta yuborish: {s} s',
  successCta: 'Tayyor',
  pendingTitle: "To'lov tekshirilmoqda",
  pendingBody: 'Bank javobini kutyapmiz — bu bir necha soniya olishi mumkin.',
  walletTitle: 'Balans',
  perOtklik: 'Har bir buyurtma: {price}',
  otkliksLeft: '≈ {count} ta buyurtmaga yetadi',
  topup: "Balansni to'ldirish",
  topupTitle: "Balansni to'ldirish",
  topupAmount: "Qancha to'ldirasiz?",
  topupService: "Balansni to'ldirish",
  topupCta: "To'ldirish · {amount}",
  topupSuccessTitle: "Balans to'ldirildi",
  topupSuccessBody: 'Balansingiz: {amount}',
  topupToast: "Balans to'ldirildi",
  balanceDrawerTitle: 'Balans yetarli emas',
  balanceDrawerBody: 'Har bir buyurtma {price} turadi. Balansingiz: {balance}.',
  balanceDrawerHint: "To'ldirgach, amal avtomatik davom etadi.",
  balanceDrawerCta: "Balansni to'ldirish",
  otklikCost: 'Balansdan {price} yechiladi · qoladi {left}',
  otklikPrice: 'Buyurtma narxi',
  otklikCount: '≈ {count} ta buyurtma',
  freeOtklik: "Otklik bepul — mijoz sizni tanlasa, ishni olish uchun {price} to'laysiz",
  takeTitle: 'Mijoz sizni tanladi',
  takeBody: "Ishni olish uchun {price} to'lang — {time} gacha. Vaqtida tasdiqlanmasa, mijoz boshqa agentlikni tanlashi mumkin.",
  takeBodyFree: 'Ishni olishni tasdiqlang — {time} gacha.',
  takeLeft: '{m} daqiqa qoldi',
  takeCta: 'Ishni olish · {price}',
  takeCtaFree: 'Ishni olish',
  takeDecline: 'Rad etish',
  takeDeclineTitle: 'Ishni rad etasizmi?',
  takeDeclineBody: 'Otklikingiz qaytarib olinadi va mijoz boshqa agentlikni tanlaydi.',
  takeDone: 'Ish sizniki! Mijoz bilan bog‘laning.',
  takeExpired: 'Ishni olish vaqti tugadi.',
}

const ru: PassStrings = {
  free: 'Пока бесплатно — плата за заказы не взимается',
  gatewayUnavailable: 'Платёжная система сейчас недоступна. Попробуйте позже.',
  genericError: 'Не удалось выполнить действие. Попробуйте ещё раз.',
  paymentUnavailable: 'Источник оплаты недоступен. Попробуйте позже.',
  unit: 'сум',
  payTotal: 'Итого',
  payCardNumber: 'Номер карты',
  payExpiry: 'Срок действия',
  payNote: 'Мы не храним данные карты — оплата проходит через ATMOS.',
  paySending: 'Отправляем…',
  payPoweredBy: 'Платёжная система',
  errCard: 'Введите номер карты полностью',
  errExpiry: 'Введите срок в формате ММ/ГГ',
  otpTitle: 'Введите код из SMS',
  otpBody: 'Код отправлен на номер, привязанный к карте {card}.',
  otpCta: 'Подтвердить',
  otpChecking: 'Проверяем…',
  otpChangeCard: 'Другая карта',
  savedCards: 'Сохранённые карты',
  newCard: 'Новая карта',
  saveCard: 'Сохранить карту',
  saveCardHint: 'В следующий раз оплата без ввода карты и SMS-кода.',
  removeCard: 'Удалить',
  removeCardConfirm: 'Удалить?',
  otpResend: 'Отправить код ещё раз',
  otpResendIn: 'Повторно через {s} с',
  successCta: 'Готово',
  pendingTitle: 'Проверяем оплату',
  pendingBody: 'Ждём ответа банка — это может занять несколько секунд.',
  walletTitle: 'Баланс',
  perOtklik: 'Каждый заказ: {price}',
  otkliksLeft: 'Хватит примерно на {count} заказов',
  topup: 'Пополнить баланс',
  topupTitle: 'Пополнение баланса',
  topupAmount: 'Сумма пополнения',
  topupService: 'Пополнение баланса',
  topupCta: 'Пополнить · {amount}',
  topupSuccessTitle: 'Баланс пополнен',
  topupSuccessBody: 'Ваш баланс: {amount}',
  topupToast: 'Баланс пополнен',
  balanceDrawerTitle: 'Недостаточно средств',
  balanceDrawerBody: 'Каждый заказ стоит {price}. Ваш баланс: {balance}.',
  balanceDrawerHint: 'После пополнения действие продолжится автоматически.',
  balanceDrawerCta: 'Пополнить баланс',
  otklikCost: 'С баланса спишется {price} · останется {left}',
  otklikPrice: 'Цена заказа',
  otklikCount: '≈ {count} заказов',
  freeOtklik: 'Отклик бесплатный — если клиент выберет вас, вы оплатите {price}, чтобы взять работу',
  takeTitle: 'Клиент выбрал вас',
  takeBody: 'Оплатите {price}, чтобы взять работу, — до {time}. Если не подтвердить вовремя, клиент может выбрать другое агентство.',
  takeBodyFree: 'Подтвердите, что берёте работу, — до {time}.',
  takeLeft: 'Осталось {m} мин',
  takeCta: 'Взять работу · {price}',
  takeCtaFree: 'Взять работу',
  takeDecline: 'Отказаться',
  takeDeclineTitle: 'Отказаться от работы?',
  takeDeclineBody: 'Ваш отклик будет отозван, и клиент выберет другое агентство.',
  takeDone: 'Работа ваша! Свяжитесь с клиентом.',
  takeExpired: 'Время, чтобы взять работу, истекло.',
}

const en: PassStrings = {
  free: 'Free for now — no per-order fee',
  gatewayUnavailable: 'Payment is not available right now. Please try again later.',
  genericError: 'Could not complete the action. Please try again.',
  paymentUnavailable: 'Payment source is unavailable. Please try later.',
  unit: 'UZS',
  payTotal: 'Total',
  payCardNumber: 'Card number',
  payExpiry: 'Expiry date',
  payNote: "We don't store your card details — the payment is processed by ATMOS.",
  paySending: 'Sending…',
  payPoweredBy: 'Payments by',
  errCard: 'Enter the full card number',
  errExpiry: 'Enter the expiry as MM/YY',
  otpTitle: 'Enter the SMS code',
  otpBody: 'We sent a code to the phone linked to {card}.',
  otpCta: 'Confirm',
  otpChecking: 'Checking…',
  otpChangeCard: 'Use another card',
  savedCards: 'Saved cards',
  newCard: 'New card',
  saveCard: 'Save card',
  saveCardHint: 'Next time pay without the card number or an SMS code.',
  removeCard: 'Remove',
  removeCardConfirm: 'Remove?',
  otpResend: 'Resend code',
  otpResendIn: 'Resend in {s} s',
  successCta: 'Done',
  pendingTitle: 'Checking the payment',
  pendingBody: 'Waiting for the bank — this can take a few seconds.',
  walletTitle: 'Balance',
  perOtklik: 'Each order: {price}',
  otkliksLeft: 'Enough for about {count} orders',
  topup: 'Top up balance',
  topupTitle: 'Top up balance',
  topupAmount: 'How much to add?',
  topupService: 'Balance top-up',
  topupCta: 'Top up · {amount}',
  topupSuccessTitle: 'Balance topped up',
  topupSuccessBody: 'Your balance: {amount}',
  topupToast: 'Balance topped up',
  balanceDrawerTitle: 'Not enough balance',
  balanceDrawerBody: 'Each order costs {price}. Your balance: {balance}.',
  balanceDrawerHint: 'After the top-up the action continues automatically.',
  balanceDrawerCta: 'Top up balance',
  otklikCost: '{price} from your balance · {left} left',
  otklikPrice: 'Order price',
  otklikCount: '≈ {count} orders',
  freeOtklik: 'The response is free — if the client picks you, you pay {price} to take the job',
  takeTitle: 'The client picked you',
  takeBody: 'Pay {price} to take the job — by {time}. If you do not confirm in time, the client may pick another agency.',
  takeBodyFree: 'Confirm you take the job — by {time}.',
  takeLeft: '{m} min left',
  takeCta: 'Take the job · {price}',
  takeCtaFree: 'Take the job',
  takeDecline: 'Decline',
  takeDeclineTitle: 'Decline the job?',
  takeDeclineBody: 'Your response is withdrawn and the client picks another agency.',
  takeDone: 'The job is yours! Get in touch with the client.',
  takeExpired: 'The time to take the job has run out.',
}

const all: Record<Locale, PassStrings> = { uz, ru, en }

export function passStrings(locale: Locale): PassStrings {
  return all[locale]
}

export function fmtSom(n: number, unit: string): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(n))} ${unit}`
}
