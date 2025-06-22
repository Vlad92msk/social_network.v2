// src/auth/hooks/useAuthActions
import { useState } from 'react'
import { useAuth } from '../AuthProvider'

interface UseAuthActionsOptions {
  clearErrorOnInput?: boolean
}

export function useAuthActions(options: UseAuthActionsOptions = {}) {
  const {
    clearErrorOnInput = true
  } = options

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
    hasProvider
  } = auth

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })


  // Обработчик изменений в форме
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Очищаем ошибку при вводе
    if (clearErrorOnInput && error) {
      clearError()
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.email && formData.password) {
      await signInWithEmail(formData.email, formData.password)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.email && formData.password && formData.name) {
      await signUpWithEmail(formData.email, formData.password, formData.name)
    }
  }

  // Создаем обработчики только для доступных провайдеров
  const createProviderHandler = (provider: string, method?: () => Promise<boolean>) => {
    if (!hasProvider(provider) || !method) {
      return undefined
    }
    return () => method()
  }

  // Валидация форм
  const isSignInValid = formData.email && formData.password
  const isSignUpValid = formData.email && formData.password && formData.name

  return {
    // Состояние формы
    formData,
    handleInputChange,

    // Обработчики провайдеров (только доступные)
    handleGoogleSignIn: createProviderHandler('google', signInWithGoogle),
    handleGitHubSignIn: createProviderHandler('github', signInWithGitHub),
    handleMicrosoftSignIn: createProviderHandler('microsoft', signInWithMicrosoft),
    handleAppleSignIn: createProviderHandler('apple', signInWithApple),
    handleFacebookSignIn: createProviderHandler('facebook', signInWithFacebook),
    handleTwitterSignIn: createProviderHandler('twitter', signInWithTwitter),
    handleYahooSignIn: createProviderHandler('yahoo', signInWithYahoo),

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
    availableProviders: {
      email: hasProvider('email'),
      google: hasProvider('google'),
      github: hasProvider('github'),
      microsoft: hasProvider('microsoft'),
      apple: hasProvider('apple'),
      facebook: hasProvider('facebook'),
      twitter: hasProvider('twitter'),
      yahoo: hasProvider('yahoo'),
    }
  }
}

