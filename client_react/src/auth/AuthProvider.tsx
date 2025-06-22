import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAuthMethods } from './providers'
import { callbackStorage, determineRedirectUrl } from './utils'
import { AUTH_CONSTANTS } from './constants'
import type { AuthState, AuthConfig } from './types'

interface AuthContextValue extends AuthState {
  // Методы авторизации
  signInWithGoogle: () => Promise<boolean>
  signInWithEmail: (email: string, password: string) => Promise<boolean>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>

  // Утилиты
  clearError: () => void
  config: AuthConfig
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
  config?: Partial<AuthConfig>
}

// Конфигурация по умолчанию - ИСПРАВЛЯЕМ guards
const defaultConfig: AuthConfig = {
  redirects: {
    afterSignIn: '/',
    afterSignOut: '/signin',
    whenUnauthenticated: '/signin'
  },
  autoRedirect: true,
  providers: ['google', 'email'],
  authPages: [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES],
  sessionTimeout: AUTH_CONSTANTS.DEFAULT_SESSION_TIMEOUT,
  guards: {
    enabled: false, // Устанавливаем явное значение
    globalTimeout: AUTH_CONSTANTS.DEFAULT_GUARD_TIMEOUT,
    fallback: 'component'
  }
}

export function AuthProvider({ children, config: userConfig }: AuthProviderProps) {
  const navigate = useNavigate()

  // Мемоизируем конфигурацию - ИСПРАВЛЯЕМ слияние guards
  const config: AuthConfig = useMemo(() => {
    const merged: AuthConfig = {
      ...defaultConfig,
      ...userConfig,
      redirects: {
        ...defaultConfig.redirects,
        ...userConfig?.redirects
      },
      authPages: userConfig?.authPages || [...AUTH_CONSTANTS.DEFAULT_AUTH_PAGES]
    }

    // Исправляем guards - всегда должен быть enabled
    if (userConfig?.guards) {
      merged.guards = {
        enabled: userConfig.guards.enabled ?? defaultConfig.guards!.enabled, // Явно устанавливаем
        globalTimeout: userConfig.guards.globalTimeout ?? defaultConfig.guards!.globalTimeout,
        fallback: userConfig.guards.fallback ?? defaultConfig.guards!.fallback,
        fallbackComponent: userConfig.guards.fallbackComponent
      }
    }

    return merged
  }, [userConfig])

  // Мемоизируем методы авторизации
  const authMethods = useMemo(() => createAuthMethods(config.providers), [config.providers])

  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
  })

  // Слушатель изменений состояния авторизации
  useEffect(() => {
    let hasRedirected = false

    const unsubscribe = authMethods.onAuthStateChanged((user) => {
      setState(prevState => {
        const wasAuthenticated = prevState.isAuthenticated
        const isNowAuthenticated = !!user

        // Редирект после успешной авторизации
        if (config.autoRedirect && !wasAuthenticated && isNowAuthenticated && !hasRedirected) {
          hasRedirected = true

          const callbackUrl = callbackStorage.get()
          const redirectTo = determineRedirectUrl(
            config.redirects.afterSignIn,
            callbackUrl,
            config.authPages
          )

          callbackStorage.remove()

          if (import.meta.env.DEV) {
            console.log('🚀 AuthProvider: выполняем редирект на:', redirectTo)
          }

          setTimeout(() => {
            navigate(redirectTo, { replace: true })
          }, 0)
        }

        return {
          ...prevState,
          user,
          isAuthenticated: isNowAuthenticated,
          isLoading: false
        }
      })
    })

    return unsubscribe
  }, [authMethods, config, navigate])

  // Обработчик ошибок
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  // Очистка ошибок
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Google авторизация
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await authMethods.signInWithGoogle()

      if (result.success) {
        setState(prev => ({ ...prev, isLoading: false }))
        return true
      } else {
        setError(result.error!)
        return false
      }
    } catch (error: any) {
      setError(error.message || AUTH_CONSTANTS.MESSAGES.AUTH_ERROR)
      return false
    }
  }, [authMethods, setError])

  // Email авторизация
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await authMethods.signInWithEmail(email, password)

      if (result.success) {
        setState(prev => ({ ...prev, isLoading: false }))
        return true
      } else {
        setError(result.error!)
        return false
      }
    } catch (error: any) {
      setError(error.message || AUTH_CONSTANTS.MESSAGES.AUTH_ERROR)
      return false
    }
  }, [authMethods, setError])

  // Регистрация через email
  const signUpWithEmail = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await authMethods.signUpWithEmail(email, password, name)

      if (result.success) {
        setState(prev => ({ ...prev, isLoading: false }))
        return true
      } else {
        setError(result.error!)
        return false
      }
    } catch (error: any) {
      setError(error.message || AUTH_CONSTANTS.MESSAGES.REGISTRATION_ERROR)
      return false
    }
  }, [authMethods, setError])

  // Выход из системы
  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await authMethods.signOut()
      setState(prev => ({ ...prev, isLoading: false }))

      callbackStorage.clear()

      if (config.autoRedirect) {
        navigate(config.redirects.afterSignOut, { replace: true })
      }
    } catch (error: any) {
      setError(AUTH_CONSTANTS.MESSAGES.SIGN_OUT_ERROR)
    }
  }, [authMethods, setError, navigate, config])

  // Сброс пароля
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await authMethods.resetPassword(email)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [authMethods, setError])

  // Мемоизируем значение контекста
  const value: AuthContextValue = useMemo(() => ({
    ...state,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    clearError,
    config
  }), [state, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, resetPassword, clearError, config])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Хук для использования контекста авторизации
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(AUTH_CONSTANTS.MESSAGES.AUTH_REQUIRED)
  }

  return context
}
