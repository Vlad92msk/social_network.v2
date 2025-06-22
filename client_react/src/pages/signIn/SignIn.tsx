import { Icon } from '@components/ui'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthActions } from '../../auth'

export const SignIn = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
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
    isSignInValid,
    isLoading,
    error,
    availableProviders
  } = useAuthActions()

  // Получаем список доступных социальных провайдеров
  const socialProviders = [
    { key: 'google', handler: handleGoogleSignIn, name: 'Google', icon: 'google' },
    { key: 'github', handler: handleGitHubSignIn, name: 'GitHub', icon: 'github' },
    { key: 'microsoft', handler: handleMicrosoftSignIn, name: 'Microsoft', icon: 'microsoft' },
    { key: 'apple', handler: handleAppleSignIn, name: 'Apple', icon: 'apple' },
    { key: 'facebook', handler: handleFacebookSignIn, name: 'Facebook', icon: 'facebook' },
    { key: 'twitter', handler: handleTwitterSignIn, name: 'Twitter', icon: 'twitter' },
    { key: 'yahoo', handler: handleYahooSignIn, name: 'Yahoo', icon: 'yahoo' }
  ].filter(provider =>
    availableProviders[provider.key as keyof typeof availableProviders] && provider.handler
  )

  // Проверяем нужна ли email форма
  const showEmailForm = availableProviders.email

  return (
    <div>
      <div>
        <div>
          <h2>
            {t('auth.signIn.title', 'Вход в аккаунт')}
          </h2>
          <p>
            {t('auth.signIn.subtitle', 'Войдите для продолжения работы')}
          </p>
        </div>

        <div>
          {/* Ошибки */}
          {error && (
            <div>
              <div>
                <Icon name="close" />
                <div>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Социальные провайдеры */}
          {socialProviders.length > 0 && (
            <div>
              {socialProviders.map(provider => (
                <button
                  key={provider.key}
                  onClick={provider.handler}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div>Загрузка...</div>
                  ) : (
                    <>
                      <Icon name={'check'} />
                      {t(`auth.signIn.${provider.key}`, `Войти через ${provider.name}`)}
                    </>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Разделитель - показываем только если есть и социальные провайдеры И email */}
          {socialProviders.length > 0 && showEmailForm && (
            <div>
              <div>
                <div />
              </div>
              <div>
                <span>
                  {t('common.or', 'или')}
                </span>
              </div>
            </div>
          )}

          {/* Email форма - показываем только если email провайдер включен */}
          {showEmailForm && (
            <form onSubmit={handleEmailSignIn}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('auth.email', 'Email адрес')}
              />

              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.password', 'Пароль')}
              />

              <button
                type="submit"
                disabled={isLoading || !isSignInValid}
              >
                {isLoading ? 'Загрузка...' : t('auth.signIn.submit', 'Войти')}
              </button>
            </form>
          )}

          {/* Ссылки - показываем только если есть email форма */}
          {showEmailForm && (
            <div>
              <button
                onClick={() => {/* TODO: Implement password reset */}}
              >
                {t('auth.forgotPassword', 'Забыли пароль?')}
              </button>

              <div>
                <span>
                  {t('auth.noAccount', 'Нет аккаунта?')}{' '}
                </span>
                <button
                  onClick={() => navigate('/signup')}
                >
                  {t('auth.signUp.link', 'Зарегистрироваться')}
                </button>
              </div>
            </div>
          )}

          {/* Fallback - если вообще нет провайдеров */}
          {socialProviders.length === 0 && !showEmailForm && (
            <div>
              <p>Нет доступных способов авторизации</p>
              <p>Проверьте настройки в Firebase Console</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
