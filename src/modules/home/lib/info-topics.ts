/**
 * "Learn PRB" tiles on the client home (Profi-style). Each opens an info sheet;
 * copy lives in i18n `clientHome.info.<id>`. `art` is static, trusted SVG
 * markup (black line drawings) for a 120×100 viewBox.
 */
export type InfoTopicId = 'tezkor' | 'tender' | 'how' | 'city' | 'price' | 'reviews' | 'free'

export interface InfoTopic {
  id: InfoTopicId
  art: string
  /** Route tiles stand out with a tint + chip; `wide` spans both columns. */
  tone?: 'tezkor' | 'tender'
  wide?: boolean
}

export const INFO_TOPICS: InfoTopic[] = [
  {
    id: 'tezkor',
    tone: 'tezkor',
    art: '<circle cx="52" cy="56" r="32" fill="#fff"/><path d="M52 34v22l14 10" stroke-width="3"/><path d="M44 16h16M52 16v8" stroke-width="3"/><path d="M92 14 76 42h13l-9 26 23-33H90l9-21z" fill="#101828"/><path d="M6 44h12M2 58h14M6 72h12" stroke-width="3"/>',
  },
  {
    id: 'tender',
    tone: 'tender',
    art: '<rect x="22" y="22" width="46" height="60" rx="4" transform="rotate(-10 45 52)" fill="#fff"/><rect x="40" y="14" width="46" height="60" rx="4" fill="#fff"/><path d="M50 28h26M50 38h26M50 48h18" stroke-width="3"/><path d="M74 84l-4 12 12-6 12 6-4-12z" fill="#101828"/><circle cx="82" cy="72" r="14" fill="#101828"/><path d="M76 72l4 4 8-8" stroke="#fff" stroke-width="3"/>',
  },
  {
    id: 'how',
    art: '<circle cx="40" cy="30" r="12" fill="#fff"/><path d="M34 22c2-7 12-7 14 0" fill="#101828"/><path d="M20 92c0-20 8-34 20-34s18 10 20 22"/><circle cx="82" cy="30" r="12" fill="#fff"/><path d="M72 28c3-9 17-9 20 0" fill="#101828" stroke="none"/><path d="M60 92c2-22 10-34 22-34s20 14 20 34z" fill="#101828"/><path d="M44 76c6-4 12-4 18 0 6 4 10 2 12-2" stroke-width="3"/><rect x="84" y="66" width="16" height="20" rx="2" fill="#fff"/>',
  },
  {
    id: 'city',
    art: '<circle cx="60" cy="44" r="30" fill="#fff"/><ellipse cx="60" cy="44" rx="13" ry="30"/><path d="M30 44h60M34 30h52M34 58h52"/><path d="M26 30a38 38 0 0 0 58 44" stroke-width="3"/><path d="M60 78v8"/><path d="M44 92h32" stroke-width="5"/><path d="M66 18c6 6 8 14 6 22-4 4-10 2-12-4-2-6 0-12 6-18z" fill="#101828"/>',
  },
  {
    id: 'price',
    wide: true,
    art: '<path d="M34 50c0-8 6-14 14-14h24c8 0 14 6 14 14v28c0 8-6 14-14 14H48c-8 0-14-6-14-14z" fill="#101828"/><path d="M46 36c0-8 6-14 14-14s14 6 14 14" stroke-width="3"/><circle cx="54" cy="22" r="4" fill="#fff"/><circle cx="66" cy="22" r="4" fill="#fff"/><ellipse cx="22" cy="44" rx="8" ry="5" fill="#fff"/><ellipse cx="96" cy="16" rx="8" ry="5" fill="#fff"/><ellipse cx="100" cy="36" rx="7" ry="4.5" fill="#fff"/><ellipse cx="18" cy="64" rx="7" ry="4.5" fill="#fff"/>',
  },
  {
    id: 'reviews',
    art: '<path d="M60 10l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z" fill="#101828"/><path d="M22 18l6 6M98 18l-6 6M60 0v4" stroke-width="3"/><path d="M30 80h60v8a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill="#fff"/><path d="M40 86h40" stroke-width="3"/>',
  },
  {
    id: 'free',
    art: '<rect x="34" y="34" width="54" height="30" rx="4" transform="rotate(-18 61 49)" fill="#fff"/><circle cx="61" cy="49" r="8" transform="rotate(-18 61 49)"/><path d="M40 30c-10-14-26-12-30-4 10 0 18 6 22 14z" fill="#101828"/><path d="M84 58c14 4 24-6 22-14-6 6-14 8-20 6z" fill="#101828"/><path d="M20 76l14-8M26 88l16-10M40 94l10-8" stroke-width="3"/>',
  },
]
