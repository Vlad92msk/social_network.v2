// src/auth/hooks/useAuthForm.ts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

interface UseAuthFormOptions {
  redirectIfAuthenticated?: boolean
  clearErrorOnInput?: boolean
}

export function useAuthForm(options: UseAuthFormOptions = {}) {
  const {
    redirectIfAuthenticated = true,
    clearErrorOnInput = true
  } = options

  const navigate = useNavigate()
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isLoading,
    error,
    clearError,
    isAuthenticated
  } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  // Редирект для авторизованных пользователей
  useEffect(() => {
    if (redirectIfAuthenticated && isAuthenticated) {
      navigate(-1) // Или AuthProvider сам сделает редирект
    }
  }, [isAuthenticated, navigate, redirectIfAuthenticated])

  // Очистка ошибок при размонтировании
  useEffect(() => {
    return clearError
  }, [clearError])

  // Обработчик изменений в форме
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Очищаем ошибку при вводе
    if (clearErrorOnInput && error) {
      clearError()
    }
  }

  // Универсальные обработчики авторизации
  const handleGoogleSignIn = () => signInWithGoogle()

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

  // Валидация форм
  const isSignInValid = formData.email && formData.password
  const isSignUpValid = formData.email && formData.password && formData.name

  return {
    // Состояние формы
    formData,
    handleInputChange,

    // Обработчики
    handleGoogleSignIn,
    handleEmailSignIn,
    handleEmailSignUp,

    // Валидация
    isSignInValid,
    isSignUpValid,

    // Состояние авторизации
    isLoading,
    error,
    clearError,
    isAuthenticated
  }
}
