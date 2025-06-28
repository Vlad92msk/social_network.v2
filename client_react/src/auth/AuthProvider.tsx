import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AUTH_CONSTANTS } from './constants'
import { useAuthConfig } from './hooks/useAuthConfig'
import { createAuthMethods } from './providers'
import type { AuthConfig, AuthState } from './types'
import { callbackStorage, determineRedirectUrl } from './utils'

interface AuthContextValue extends AuthState {
  // Базовые методы (всегда доступны)
  signInWithGoogle: () => Promise<boolean>
  signInWithEmail: (email: string, password: string) => Promise<boolean>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>

  // Дополнительные провайдеры (могут отсутствовать)
  signInWithGitHub?: () => Promise<boolean>
  signInWithMicrosoft?: () => Promise<boolean>
  signInWithApple?: () => Promise<boolean>
  signInWithFacebook?: () => Promise<boolean>
  signInWithTwitter?: () => Promise<boolean>
  signInWithYahoo?: () => Promise<boolean>

  // Утилиты
  clearError: VoidFunction
  config: AuthConfig

  // Дополнительные утилиты
  hasProvider: (provider: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
  config?: Partial<AuthConfig>
}

/**
 * Провайдер авторизации с поддержкой множественных провайдеров и guards
 */
export function AuthProvider({ children, config: userConfig }: AuthProviderProps) {
  const navigate = useNavigate()

  // Используем хук для мемоизации конфигурации
  const config = useAuthConfig(userConfig)

  // Мемоизируем методы авторизации
  const authMethods = useMemo(() => createAuthMethods(config.providers), [config.providers])

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  })

  // Слушатель изменений состояния авторизации
  useEffect(() => {
    let hasRedirected = false

    const unsubscribe = authMethods.onAuthStateChanged((user) => {
      setState((prevState) => {
        const wasAuthenticated = prevState.isAuthenticated
        const isNowAuthenticated = !!user

        // Редирект после успешной авторизации
        if (config.autoRedirect && !wasAuthenticated && isNowAuthenticated && !hasRedirected) {
          hasRedirected = true

          const callbackUrl = callbackStorage.get()
          const redirectTo = determineRedirectUrl(config.redirects.afterSignIn, callbackUrl, config.authPages)

          callbackStorage.remove()

          if (import.meta.env.DEV) {
            console.log('🚀 AuthProvider: выполняем редирект на:', redirectTo)
          }

          navigate(redirectTo, { replace: true })
        }

        return {
          ...prevState,
          user,
          isAuthenticated: isNowAuthenticated,
          isLoading: false,
        }
      })
    })

    return unsubscribe
  }, [authMethods, config, navigate])

  // Обработчик ошибок
  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }, [])

  // Очистка ошибок
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // Универсальная функция для создания обработчиков провайдеров
  const createProviderHandler = useCallback(
    (methodName: string) => {
      return async (): Promise<boolean> => {
        // Проверяем что метод доступен
        if (typeof authMethods[methodName] !== 'function') {
          setError(`Провайдер ${methodName} не настроен`)
          return false
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }))

        try {
          const result = await authMethods[methodName]()

          if (result.success) {
            setState((prev) => ({ ...prev, isLoading: false }))
            return true
          } else {
            setError(result.error!)
            return false
          }
        } catch (error: any) {
          setError(error.message || AUTH_CONSTANTS.MESSAGES.AUTH_ERROR)
          return false
        }
      }
    },
    [authMethods, setError],
  )

  // Базовые методы
  const signInWithGoogle = useCallback(() => createProviderHandler('signInWithGoogle')(), [createProviderHandler])
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await authMethods.signInWithEmail(email, password)

        if (result.success) {
          setState((prev) => ({ ...prev, isLoading: false }))
          return true
        } else {
          setError(result.error!)
          return false
        }
      } catch (error: any) {
        setError(error.message || AUTH_CONSTANTS.MESSAGES.AUTH_ERROR)
        return false
      }
    },
    [authMethods, setError],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await authMethods.signUpWithEmail(email, password, name)

        if (result.success) {
          setState((prev) => ({ ...prev, isLoading: false }))
          return true
        } else {
          setError(result.error!)
          return false
        }
      } catch (error: any) {
        setError(error.message || AUTH_CONSTANTS.MESSAGES.REGISTRATION_ERROR)
        return false
      }
    },
    [authMethods, setError],
  )

  // Дополнительные провайдеры (условно создаются)
  const signInWithGitHub = useMemo(
    () => (authMethods.signInWithGitHub ? createProviderHandler('signInWithGitHub') : undefined),
    [authMethods.signInWithGitHub, createProviderHandler],
  )

  const signInWithMicrosoft = useMemo(
    () => (authMethods.signInWithMicrosoft ? createProviderHandler('signInWithMicrosoft') : undefined),
    [authMethods.signInWithMicrosoft, createProviderHandler],
  )

  const signInWithApple = useMemo(() => (authMethods.signInWithApple ? createProviderHandler('signInWithApple') : undefined), [authMethods.signInWithApple, createProviderHandler])

  const signInWithFacebook = useMemo(
    () => (authMethods.signInWithFacebook ? createProviderHandler('signInWithFacebook') : undefined),
    [authMethods.signInWithFacebook, createProviderHandler],
  )

  const signInWithTwitter = useMemo(
    () => (authMethods.signInWithTwitter ? createProviderHandler('signInWithTwitter') : undefined),
    [authMethods.signInWithTwitter, createProviderHandler],
  )

  const signInWithYahoo = useMemo(() => (authMethods.signInWithYahoo ? createProviderHandler('signInWithYahoo') : undefined), [authMethods.signInWithYahoo, createProviderHandler])

  // Выход из системы
  const signOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      await authMethods.signOut()
      setState((prev) => ({ ...prev, isLoading: false }))

      callbackStorage.clear()

      if (config.autoRedirect) {
        navigate(config.redirects.afterSignOut, { replace: true })
      }
    } catch (error: any) {
      setError(AUTH_CONSTANTS.MESSAGES.SIGN_OUT_ERROR)
    }
  }, [authMethods, setError, navigate, config])

  // Сброс пароля
  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      try {
        await authMethods.resetPassword(email)
      } catch (error: any) {
        setError(error.message)
        throw error
      }
    },
    [authMethods, setError],
  )

  // Проверка наличия провайдера
  const hasProvider = useCallback(
    (provider: string): boolean => {
      return config.providers.includes(provider as any)
    },
    [config.providers],
  )

  // Мемоизируем значение контекста
  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      resetPassword,

      // Условно добавляем дополнительные провайдеры
      ...(signInWithGitHub && { signInWithGitHub }),
      ...(signInWithMicrosoft && { signInWithMicrosoft }),
      ...(signInWithApple && { signInWithApple }),
      ...(signInWithFacebook && { signInWithFacebook }),
      ...(signInWithTwitter && { signInWithTwitter }),
      ...(signInWithYahoo && { signInWithYahoo }),

      clearError,
      config,
      hasProvider,
    }),
    [
      state,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      resetPassword,
      signInWithGitHub,
      signInWithMicrosoft,
      signInWithApple,
      signInWithFacebook,
      signInWithTwitter,
      signInWithYahoo,
      clearError,
      config,
      hasProvider,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(AUTH_CONSTANTS.MESSAGES.AUTH_REQUIRED)
  }

  return context
}
