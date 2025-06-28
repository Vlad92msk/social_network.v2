/**
 * / <reference models="vite/client" />
 */

interface ImportMetaEnv {
  DEV: any
  VITE_FIREBASE_MESSAGING_SENDER_ID: any
  VITE_FIREBASE_APP_ID: any
  VITE_FIREBASE_STORAGE_BUCKET: any
  VITE_FIREBASE_PROJECT_ID: any
  VITE_FIREBASE_AUTH_DOMAIN: any
  VITE_FIREBASE_API_KEY: any
  NODE_ENV: any
  VITE_API_URL: string | undefined
  readonly VITE_APP_TITLE: string
  // добавьте другие env переменные здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
