// src/auth/hooks/useAuthActions
import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '../AuthProvider'

interface UseAuthActionsOptions {
  clearErrorOnInput?: boolean
}

export function useAuthActions(options: UseAuthActionsOptions = {}) {
  const { clearErrorOnInput = true } = options

  const auth = useAuth()

  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithGitHub,
    signInWithMicrosoft,
    signInWithApple,
    signInWithFacebook,
    signInWithTwitter,
    signInWithYahoo,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    hasProvider,
  } = auth

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  // Мемоизируем объект availableProviders
  const availableProviders = useMemo(
    () => ({
      email: hasProvider('email'),
      google: hasProvider('google'),
      github: hasProvider('github'),
      microsoft: hasProvider('microsoft'),
      apple: hasProvider('apple'),
      facebook: hasProvider('facebook'),
      twitter: hasProvider('twitter'),
      yahoo: hasProvider('yahoo'),
    }),
    [hasProvider],
  )

  // Обработчик изменений в форме
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      // Очищаем ошибку при вводе
      if (clearErrorOnInput && error) {
        clearError()
      }
    },
    [clearErrorOnInput, error, clearError],
  )

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (formData.email && formData.password) {
        await signInWithEmail(formData.email, formData.password)
      }
    },
    [formData.email, formData.password, signInWithEmail],
  )

  const handleEmailSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (formData.email && formData.password && formData.name) {
        await signUpWithEmail(formData.email, formData.password, formData.name)
      }
    },
    [formData.email, formData.password, formData.name, signUpWithEmail],
  )

  // Мемоизируем обработчики провайдеров
  const handleGoogleSignIn = useMemo(() => {
    if (!hasProvider('google') || !signInWithGoogle) {
      return undefined
    }
    return signInWithGoogle
  }, [hasProvider, signInWithGoogle])

  const handleGitHubSignIn = useMemo(() => {
    if (!hasProvider('github') || !signInWithGitHub) {
      return undefined
    }
    return signInWithGitHub
  }, [hasProvider, signInWithGitHub])

  const handleMicrosoftSignIn = useMemo(() => {
    if (!hasProvider('microsoft') || !signInWithMicrosoft) {
      return undefined
    }
    return signInWithMicrosoft
  }, [hasProvider, signInWithMicrosoft])

  const handleAppleSignIn = useMemo(() => {
    if (!hasProvider('apple') || !signInWithApple) {
      return undefined
    }
    return signInWithApple
  }, [hasProvider, signInWithApple])

  const handleFacebookSignIn = useMemo(() => {
    if (!hasProvider('facebook') || !signInWithFacebook) {
      return undefined
    }
    return signInWithFacebook
  }, [hasProvider, signInWithFacebook])

  const handleTwitterSignIn = useMemo(() => {
    if (!hasProvider('twitter') || !signInWithTwitter) {
      return undefined
    }
    return signInWithTwitter
  }, [hasProvider, signInWithTwitter])

  const handleYahooSignIn = useMemo(() => {
    if (!hasProvider('yahoo') || !signInWithYahoo) {
      return undefined
    }
    return signInWithYahoo
  }, [hasProvider, signInWithYahoo])

  // Валидация форм
  const isSignInValid = useMemo(() => !!(formData.email && formData.password), [formData.email, formData.password])

  const isSignUpValid = useMemo(() => !!(formData.email && formData.password && formData.name), [formData.email, formData.password, formData.name])

  // Мемоизируем весь возвращаемый объект
  return useMemo(
    () => ({
      // Состояние формы
      formData,
      handleInputChange,

      // Обработчики провайдеров (только доступные)
      handleGoogleSignIn,
      handleGitHubSignIn,
      handleMicrosoftSignIn,
      handleAppleSignIn,
      handleFacebookSignIn,
      handleTwitterSignIn,
      handleYahooSignIn,

      // Email обработчики
      handleEmailSignIn,
      handleEmailSignUp,

      // Валидация
      isSignInValid,
      isSignUpValid,

      // Состояние авторизации
      isLoading,
      error,
      clearError,
      isAuthenticated,

      // Утилиты
      hasProvider,
      availableProviders,
    }),
    [
      formData,
      handleInputChange,
      handleGoogleSignIn,
      handleGitHubSignIn,
      handleMicrosoftSignIn,
      handleAppleSignIn,
      handleFacebookSignIn,
      handleTwitterSignIn,
      handleYahooSignIn,
      handleEmailSignIn,
      handleEmailSignUp,
      isSignInValid,
      isSignUpValid,
      isLoading,
      error,
      clearError,
      isAuthenticated,
      hasProvider,
      availableProviders,
    ],
  )
}
