import { Icon } from '@components/ui'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthForm } from '../../auth/hooks/useAuthForm'

export const SignIn = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
    formData,
    handleInputChange,
    handleGoogleSignIn,
    handleEmailSignIn,
    isSignInValid,
    isLoading,
    error
  } = useAuthForm()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signIn.title', 'Вход в аккаунт')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.signIn.subtitle', 'Войдите для продолжения работы')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Ошибки */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <Icon name="close" className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Google авторизация */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <Icon name="google" className="w-5 h-5 mr-3" />
                {t('auth.signIn.google', 'Войти через Google')}
              </>
            )}
          </button>

          {/* Разделитель */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {t('common.or', 'или')}
              </span>
            </div>
          </div>

          {/* Email форма */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="relative block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t('auth.email', 'Email адрес')}
            />

            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="relative block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t('auth.password', 'Пароль')}
            />

            <button
              type="submit"
              disabled={isLoading || !isSignInValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('auth.signIn.submit', 'Войти')
              )}
            </button>
          </form>

          {/* Ссылки */}
          <div className="text-center space-y-2">
            <button
              onClick={() => {/* TODO: Implement password reset */}}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {t('auth.forgotPassword', 'Забыли пароль?')}
            </button>

            <div className="text-sm">
              <span className="text-gray-600">
                {t('auth.noAccount', 'Нет аккаунта?')}{' '}
              </span>
              <button
                onClick={() => navigate('/signup')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {t('auth.signUp.link', 'Зарегистрироваться')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
