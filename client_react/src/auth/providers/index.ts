// src/auth/providers/index.ts
import type { AuthProviderInterface, AuthMethods, AuthProvider, FirebaseProvider, ExternalProvider, AuthResult } from '../types'
import { firebaseAuthMethods } from './firebase'
// import { auth0AuthMethods } from './auth0'
// import { githubDirectAuthMethods } from './github-direct' // Прямой GitHub OAuth
// import { oktaAuthMethods } from './okta'

// Все провайдеры, поддерживаемые Firebase
const FIREBASE_PROVIDERS: Record<FirebaseProvider, AuthProviderInterface> = {
  google: {
    name: 'google',
    methods: firebaseAuthMethods // signInWithGoogle через Firebase
  },
  email: {
    name: 'email',
    methods: firebaseAuthMethods // signInWithEmail через Firebase
  },
  github: {
    name: 'github',
    methods: firebaseAuthMethods // signInWithGitHub через Firebase
  },
  microsoft: {
    name: 'microsoft',
    methods: firebaseAuthMethods // signInWithMicrosoft через Firebase
  },
  apple: {
    name: 'apple',
    methods: firebaseAuthMethods // signInWithApple через Firebase
  },
  facebook: {
    name: 'facebook',
    methods: firebaseAuthMethods // signInWithFacebook через Firebase
  },
  twitter: {
    name: 'twitter',
    methods: firebaseAuthMethods // signInWithTwitter через Firebase
  },
  yahoo: {
    name: 'yahoo',
    methods: firebaseAuthMethods // signInWithYahoo через Firebase
  }
}

// Внешние провайдеры (не через Firebase)
const EXTERNAL_PROVIDERS: Record<ExternalProvider, AuthProviderInterface> = {
  auth0: {
    name: 'auth0',
    methods: {} // Прямая работа с Auth0 SDK // TODO: Реализовать
  },
  okta: {
    name: 'okta',
    methods: {} // Прямая работа с Okta SDK // TODO: Реализовать
  },
  supabase: {
    name: 'supabase',
    methods: {} // TODO: Реализовать Supabase Auth
  },
  cognito: {
    name: 'cognito',
    methods: {} // TODO: Реализовать AWS Cognito
  },
  clerk: {
    name: 'clerk',
    methods: {} // TODO: Реализовать Clerk
  }
}

// Объединенный регистр всех провайдеров
const authProviders: Record<AuthProvider, AuthProviderInterface> = {
  ...FIREBASE_PROVIDERS,
  ...EXTERNAL_PROVIDERS
}

// Утилиты для создания методов-заглушек
function createUnsupportedAuthMethod(methodName: string): () => Promise<AuthResult> {
  return () => Promise.resolve({
    success: false,
    error: `${methodName} не поддерживается выбранными провайдерами`
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
  const firebaseProvidersEnabled = enabledProviders.filter(p => p in FIREBASE_PROVIDERS)
  const externalProvidersEnabled = enabledProviders.filter(p => p in EXTERNAL_PROVIDERS)

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
    onAuthStateChanged: primaryProvider.onAuthStateChanged || createUnsupportedListenerMethod()
  }

  // Добавляем специфичные методы от включенных провайдеров
  const enhancedMethods: any = { ...baseMethods }

  enabledProviders.forEach(providerName => {
    const provider = authProviders[providerName]
    const methods = provider.methods

    // Добавляем все методы от провайдера
    Object.keys(methods).forEach(methodName => {
      if (typeof methods[methodName as keyof typeof methods] === 'function') {
        enhancedMethods[methodName] = methods[methodName as keyof typeof methods]
      }
    })
  })

  return enhancedMethods
}

// Получение конкретного провайдера
export function getAuthProvider(provider: AuthProvider): AuthProviderInterface {
  return authProviders[provider]
}

// Проверка, является ли провайдер Firebase-based
export function isFirebaseProvider(provider: AuthProvider): provider is FirebaseProvider {
  return provider in FIREBASE_PROVIDERS
}

// Проверка, является ли провайдер внешним
export function isExternalProvider(provider: AuthProvider): provider is ExternalProvider {
  return provider in EXTERNAL_PROVIDERS
}

// Получение всех доступных методов для набора провайдеров
export function getAvailableMethods(providers: AuthProvider[]): string[] {
  const methods = new Set<string>()

  providers.forEach(providerName => {
    const provider = authProviders[providerName]
    Object.keys(provider.methods).forEach(method => {
      if (typeof provider.methods[method as keyof typeof provider.methods] === 'function') {
        methods.add(method)
      }
    })
  })

  return Array.from(methods)
}

export { authProviders, FIREBASE_PROVIDERS, EXTERNAL_PROVIDERS }
