// src/auth/config.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Логирование для диагностики (только в dev)
if (import.meta.env.DEV) {
  console.log('🔥 Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✅ Loaded' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Loaded' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Loaded' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Loaded' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Loaded' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Loaded' : '❌ Missing',
  })
}

// Инициализация Firebase
export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)

// Проверка конфигурации
export function validateFirebaseConfig(): void {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
  ]

  const missing = requiredVars.filter(varName => !import.meta.env[varName])

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all Firebase configuration variables are set.'
    )
  }
}
