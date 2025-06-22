// src/auth/providers/firebase.ts
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'

import { firebaseAuth, validateFirebaseConfig } from '../config'
import type { User, AuthResult, AuthMethods } from '../types'

validateFirebaseConfig()

// Полный Firebase провайдер со всеми поддерживаемыми методами
export const firebaseAuthMethods: AuthMethods & {
  // Дополнительные методы для провайдеров, поддерживаемых Firebase
  signInWithGitHub(): Promise<AuthResult>
  signInWithMicrosoft(): Promise<AuthResult>
  signInWithApple(): Promise<AuthResult>
  signInWithFacebook(): Promise<AuthResult>
  signInWithTwitter(): Promise<AuthResult>
  signInWithYahoo(): Promise<AuthResult>
} = {

  // БАЗОВЫЕ МЕТОДЫ (обязательные)

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signUpWithEmail(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)

      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() })
      }

      const user = mapFirebaseUser(result.user)
      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(firebaseAuth)
    } catch (error) {
      console.error('Sign-out error:', error)
      throw error
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(firebaseAuth, email)
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw new Error(getErrorMessage(error))
    }
  },

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null)
    })
  },

  // ДОПОЛНИТЕЛЬНЫЕ ПРОВАЙДЕРЫ (через Firebase)

  async signInWithGitHub(): Promise<AuthResult> {
    try {
      const provider = new GithubAuthProvider()
      provider.addScope('user:email')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithMicrosoft(): Promise<AuthResult> {
    try {
      const provider = new OAuthProvider('microsoft.com')
      provider.addScope('email')
      provider.addScope('profile')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithApple(): Promise<AuthResult> {
    try {
      const provider = new OAuthProvider('apple.com')
      provider.addScope('email')
      provider.addScope('name')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithFacebook(): Promise<AuthResult> {
    try {
      const provider = new FacebookAuthProvider()
      provider.addScope('email')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithTwitter(): Promise<AuthResult> {
    try {
      const provider = new TwitterAuthProvider()

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  },

  async signInWithYahoo(): Promise<AuthResult> {
    try {
      const provider = new OAuthProvider('yahoo.com')
      provider.addScope('email')

      const result = await signInWithPopup(firebaseAuth, provider)
      const user = mapFirebaseUser(result.user)

      return { user, success: true }
    } catch (error: any) {
      return { error: getErrorMessage(error), success: false }
    }
  }
}

// Утилиты
const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  const providerId = firebaseUser.providerData[0]?.providerId || 'password'

  let provider: string = 'email'
  if (providerId.includes('google')) provider = 'google'
  else if (providerId.includes('github')) provider = 'github'
  else if (providerId.includes('microsoft')) provider = 'microsoft'
  else if (providerId.includes('apple')) provider = 'apple'
  else if (providerId.includes('facebook')) provider = 'facebook'
  else if (providerId.includes('twitter')) provider = 'twitter'
  else if (providerId.includes('yahoo')) provider = 'yahoo'

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    name: firebaseUser.displayName,
    avatar: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    provider: provider as any
  }
}

function getErrorMessage(error: any): string {
  const errorMessages: Record<string, string> = {
    'auth/network-request-failed': 'Проблемы с сетью. Проверьте подключение к интернету',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
    'auth/user-not-found': 'Пользователь с таким email не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/user-disabled': 'Аккаунт заблокирован',
    'auth/invalid-email': 'Некорректный email адрес',
    'auth/invalid-credential': 'Неверные данные для входа',
    'auth/email-already-in-use': 'Этот email уже используется',
    'auth/weak-password': 'Пароль слишком простой (минимум 6 символов)',
    'auth/popup-closed-by-user': 'Окно авторизации было закрыто',
    'auth/popup-blocked': 'Браузер заблокировал всплывающее окно',
    'auth/cancelled-popup-request': 'Авторизация была отменена',
    'auth/operation-not-allowed': 'Провайдер не активирован в Firebase Console',
  }

  return errorMessages[error.code] || error.message || 'Произошла неизвестная ошибка'
}
