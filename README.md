# AdSpace Mini App

Modern Telegram Mini App frontend for the AdSpace marketplace — built with Vue 3, TypeScript, Tailwind CSS v4, and a macOS Tahoe-inspired glass UI.

## Stack

- Vue 3 + TypeScript + Vite
- Vue Router + Pinia
- Tailwind CSS v4 + shadcn-vue
- Axios + `@twa-dev/sdk`
- Laravel backend API (`adspace_backend`)

## Getting started

```bash
cd adspace_miniapp
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8000`

Vite proxies `/api` to the Laravel backend in development.

## Environment

```env
VITE_API_BASE_URL=
```

Leave empty in development to use the Vite proxy.

Backend must have:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
```

## Auth flow

1. User opens the mini app in Telegram
2. Frontend reads `Telegram.WebApp.initDataUnsafe.user`
3. Sends `POST /api/v1/auth/telegram` with `{ telegram_id, first_name, last_name, username }`
4. Backend upserts the user (new users get `role: "client"`) and returns a Sanctum token + user
5. Token is stored in `localStorage` and attached to API requests as `Authorization: Bearer …`

> Note: the backend no longer verifies the Telegram `initData` signature — it trusts the
> submitted fields. `phone` is not sent (it is not part of initData); capturing it would require
> `WebApp.requestContact()`.

## Project structure

```
src/
├── app/                    # App entry, root router
│   ├── main.ts
│   ├── App.vue
│   └── router.ts
├── core/                   # Shared infrastructure
│   ├── api/                # HTTP client, error helpers
│   ├── composables/        # useTelegram, useTheme
│   ├── constants/
│   ├── lib/                # utils, telegram-init
│   ├── types/              # shared API types
│   └── ui/                 # shared UI primitives
└── modules/                # Feature modules
    ├── auth/
    │   ├── components/
    │   ├── composables/
    │   ├── services/
    │   ├── stores/
    │   └── types/
    ├── shell/              # layout, tab bar, app routes
    ├── home/
    ├── marketplace/
    ├── agent/
    └── profile/
```

Each module owns its **pages**, **components**, **routes**, **services**, and **types**.

## Screens

| Route | Screen |
|-------|--------|
| `/auth` | Telegram splash + auto login |
| `/` | Home dashboard |
| `/marketplace` | Agent marketplace |
| `/agent` | B2B agent hub / application |
| `/profile` | Account + logout |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Agent flow

The `agent` module drives the "become an agent" application against the backend:

- `GET /api/v1/categories?type=agent` — service categories for the form
- `GET /api/v1/agent/profile` — the user's application/profile (or `null`)
- `POST /api/v1/agent/profile` — submit a new application (→ `pending`)
- `PUT /api/v1/agent/profile` — edit a pending one / resubmit a rejected one (`rejected` → `pending`)

`AgentHubPage` renders by `agent_profile.status`: no profile → intro + form, `pending` →
status card (+ optional edit), `rejected` → status card with reviewer feedback + resubmit form,
`approved` → agent hub. State lives in `modules/agent/stores/agent.store.ts`.

## Notes

- Marketplace agents still use mock data until backend listing APIs are ready
- Admin approval of agent applications happens in `adspace_admin` (not the mini app)
- Flutter mobile auth will reuse the same backend `/api/v1/auth/telegram` endpoint
