/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  Telegram?: {
    WebApp: {
      initData: string
      initDataUnsafe: {
        user?: {
          id: number
          first_name?: string
          last_name?: string
          username?: string
        }
      }
      ready: () => void
      expand: () => void
      close: () => void
      colorScheme: 'light' | 'dark'
      platform: string
      disableVerticalSwipes: () => void
      setHeaderColor: (color: string) => void
      setBackgroundColor: (color: string) => void
      requestContact?: (callback: (granted: boolean) => void) => void
      HapticFeedback?: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
      }
    }
  }
}
