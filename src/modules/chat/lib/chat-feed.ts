import dayjs from 'dayjs'

/**
 * A rendered chat feed weaves date separators between messages and marks where
 * each run of same-sender messages starts/ends, so the UI can group bubbles
 * Telegram-style (name on the first, tail on the last).
 */
export type ChatFeedItem<M> =
  | { kind: 'date', key: string, date: string }
  | { kind: 'message', key: string, message: M, first: boolean, last: boolean }

interface FeedInput {
  senderId: number
  createdAt: string
}

/**
 * Build the feed from chronologically-ordered messages. `accessor` extracts the
 * sender id + timestamp so the same helper serves the global and order chats,
 * whose message shapes differ.
 */
export function buildChatFeed<M extends { id: number }>(
  messages: M[],
  accessor: (message: M) => FeedInput,
): ChatFeedItem<M>[] {
  const items: ChatFeedItem<M>[] = []

  messages.forEach((message, index) => {
    const current = accessor(message)
    const prev = index > 0 ? accessor(messages[index - 1]!) : null
    const next = index < messages.length - 1 ? accessor(messages[index + 1]!) : null

    const newDay = !prev || !dayjs(current.createdAt).isSame(prev.createdAt, 'day')

    if (newDay) {
      items.push({
        kind: 'date',
        key: `date-${message.id}`,
        date: current.createdAt,
      })
    }

    // A group breaks on a new day or a different sender.
    const first = newDay || !prev || prev.senderId !== current.senderId
    const nextNewDay = !next || !dayjs(current.createdAt).isSame(next.createdAt, 'day')
    const last = nextNewDay || !next || next.senderId !== current.senderId

    items.push({ kind: 'message', key: `msg-${message.id}`, message, first, last })
  })

  return items
}
