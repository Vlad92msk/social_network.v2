// src/auth/providers/index.ts
import type { AuthMethods, AuthProvider, AuthProviderInterface, AuthResult, ExternalProvider, FirebaseProvider } from '../types'
import { firebaseAuthMethods } from './firebase'

// Все провайдеры, поддерживаемые Firebase
const FIREBASE_PROVIDERS: Record<FirebaseProvider, AuthProviderInterface> = {
  google: {
    name: 'google',
    methods: firebaseAuthMethods,
  },
  email: {
    name: 'email',
    methods: firebaseAuthMethods,
  },
  github: {
    name: 'github',
    methods: firebaseAuthMethods,
  },
  microsoft: {
    name: 'microsoft',
    methods: firebaseAuthMethods,
  },
  apple: {
    name: 'apple',
    methods: firebaseAuthMethods,
  },
  facebook: {
    name: 'facebook',
    methods: firebaseAuthMethods,
  },
  twitter: {
    name: 'twitter',
    methods: firebaseAuthMethods,
  },
  yahoo: {
    name: 'yahoo',
    methods: firebaseAuthMethods,
  },
}

// Внешние провайдеры (не через Firebase)
const EXTERNAL_PROVIDERS: Record<ExternalProvider, AuthProviderInterface> = {
  auth0: {
    name: 'auth0',
    methods: {}, // TODO: Реализовать
  },
  okta: {
    name: 'okta',
    methods: {}, // TODO: Реализовать
  },
  supabase: {
    name: 'supabase',
    methods: {}, // TODO: Реализовать
  },
  cognito: {
    name: 'cognito',
    methods: {}, // TODO: Реализовать
  },
  clerk: {
    name: 'clerk',
    methods: {}, // TODO: Реализовать
  },
}

// Объединенный регистр всех провайдеров
const authProviders: Record<AuthProvider, AuthProviderInterface> = {
  ...FIREBASE_PROVIDERS,
  ...EXTERNAL_PROVIDERS,
}

// Утилиты для создания методов-заглушек
function createUnsupportedAuthMethod(methodName: string): () => Promise<AuthResult> {
  return () =>
    Promise.resolve({
      success: false,
      error: `${methodName} не поддерживается выбранными провайдерами`,
    })
}

function createUnsupportedVoidMethod(methodName: string): () => Promise<void> {
  return () => {
    console.warn(`${methodName} не поддерживается выбранными провайдерами`)
    return Promise.resolve()
  }
}

function createUnsupportedListenerMethod(): () => () => void {
  return () => {
    console.warn('onAuthStateChanged не поддерживается выбранными провайдерами')
    return () => {}
  }
}

// Фабрика для создания унифицированных методов авторизации
export function createAuthMethods(enabledProviders: AuthProvider[]): AuthMethods & Record<string, any> {
  // Определяем основной провайдер для базовых методов
  let primaryProvider: Partial<AuthMethods> = firebaseAuthMethods

  // Если используются только внешние провайдеры, берем первый как основной
  const firebaseProvidersEnabled = enabledProviders.filter((p) => p in FIREBASE_PROVIDERS)
  const externalProvidersEnabled = enabledProviders.filter((p) => p in EXTERNAL_PROVIDERS)

  if (firebaseProvidersEnabled.length === 0 && externalProvidersEnabled.length > 0) {
    const firstExternal = externalProvidersEnabled[0]
    primaryProvider = authProviders[firstExternal].methods
  }

  // Базовые методы от основного провайдера
  const baseMethods: AuthMethods = {
    signInWithGoogle: primaryProvider.signInWithGoogle || createUnsupportedAuthMethod('Google авторизация'),
    signInWithEmail: primaryProvider.signInWithEmail || createUnsupportedAuthMethod('Email авторизация'),
    signUpWithEmail: primaryProvider.signUpWithEmail || createUnsupportedAuthMethod('Регистрация через email'),
    signOut: primaryProvider.signOut || createUnsupportedVoidMethod('Выход из системы'),
    resetPassword: primaryProvider.resetPassword || createUnsupportedVoidMethod('Сброс пароля'),
    onAuthStateChanged: primaryProvider.onAuthStateChanged || createUnsupportedListenerMethod(),
  }

  // Добавляем специфичные методы от включенных провайдеров
  const enhancedMethods: any = { ...baseMethods }

  enabledProviders.forEach((providerName) => {
    const provider = authProviders[providerName]
    const methods = provider.methods

    // Добавляем все методы от провайдера
    Object.keys(methods).forEach((methodName) => {
      if (typeof methods[methodName as keyof typeof methods] === 'function') {
        enhancedMethods[methodName] = methods[methodName as keyof typeof methods]
      }
    })
  })

  return enhancedMethods
}

// Проверка, является ли провайдер Firebase-based
export function isFirebaseProvider(provider: AuthProvider): provider is FirebaseProvider {
  return provider in FIREBASE_PROVIDERS
}

// Проверка, является ли провайдер внешним
export function isExternalProvider(provider: AuthProvider): provider is ExternalProvider {
  return provider in EXTERNAL_PROVIDERS
}

export { authProviders, EXTERNAL_PROVIDERS, FIREBASE_PROVIDERS }
