import { makeCn } from '@utils'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '../../auth'
import { Image } from '../../components/ui/common/Image'
import { Text, TextPropsFontSize } from '../../components/ui/common/Text'
import { Button } from '../../components/ui/common/Button'
import { Icon } from '../../components/ui'
import { HeaderMenu } from './components/HeaderMenu'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

// Попробуйте напрямую:
console.log('Direct style access:', style['Signin__BckImage'])
console.log('Available classes:', Object.keys(style))

console.log('ddwed', cn('BckImage'))
export function SignIn() {
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

  const fs: TextPropsFontSize = {
    xl: '28',
    xs: '14',
    es: '8',
  }

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

  console.log('cn', cn('BckImage'))
  return (
    <>
      <Image className={cn('BckImage')} alt="bck" width={1800} height={1800} src="base/auth" />
      <HeaderMenu />
      <main className={cn()}>
        <section className={cn('Salutation')}>
          <Text fs={fs} letterSpacing={0.03}>
            Привет! Меня зовут{' '}
          </Text>
          <Text fs={fs} className={cn('MyName')} weight="bold">Влад</Text>
          <br />
          <Text fs={fs}>Я </Text>
          <Text fs={fs} className={cn('MyPosition')} weight="bold">frontend-developer</Text>
          <br />
          <br />
          <Text fs={fs}>А это мой учебный проект</Text>
          <br />
          <Text fs={fs}>Здесь я экспериментирую с подходами/технологиями и т.д.</Text>
          <br />
          <br />
          <Text fs={fs}>Занимаюсь им по мере свободного времени</Text>
        </section>

        <section className={cn('Enter')}>
          {/* Ошибки */}
          {error && (
            <div className={cn('Error')}>
              <Icon name="close" />
              <Text fs="14">{error}</Text>
            </div>
          )}

          <Text className={cn('EnterText')} fs="14">
            {t('Auth.enterBy', 'Войти с помощью:')}
          </Text>

          <div className={cn('EnterButtonsList')}>
            {/* Социальные провайдеры */}
            {socialProviders.map(provider => (
              <Button
                key={provider.key}
                className={cn('EnterButton')}
                onClick={provider.handler}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text fs="14">Загрузка...</Text>
                ) : (
                  <>
                    <Icon name={provider.icon as any} />
                    <Text fs="14">
                      {t(`auth.signIn.${provider.key}`, provider.name)}
                    </Text>
                  </>
                )}
              </Button>
            ))}

            {/* Разделитель */}
            {socialProviders.length > 0 && showEmailForm && (
              <div className={cn('Divider')}>
                <Text fs="14">
                  {t('common.or', 'или')}
                </Text>
              </div>
            )}

            {/* Email форма */}
            {showEmailForm && (
              <form onSubmit={handleEmailSignIn} className={cn('EmailForm')}>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t('auth.email', 'Email адрес')}
                  className={cn('EmailInput')}
                />

                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('auth.password', 'Пароль')}
                  className={cn('PasswordInput')}
                />

                <Button
                  type="submit"
                  disabled={isLoading || !isSignInValid}
                  className={cn('SubmitButton')}
                >
                  <Text fs="14">
                    {isLoading ? 'Загрузка...' : t('auth.signIn.submit', 'Войти')}
                  </Text>
                </Button>
              </form>
            )}

            {/* Дополнительные ссылки */}
            {showEmailForm && (
              <div className={cn('AuthLinks')}>
                <button
                  onClick={() => {/* TODO: Implement password reset */}}
                  className={cn('ForgotPassword')}
                >
                  <Text fs="12">
                    {t('auth.forgotPassword', 'Забыли пароль?')}
                  </Text>
                </button>

                <div className={cn('SignUpLink')}>
                  <Text fs="12">
                    {t('auth.noAccount', 'Нет аккаунта?')}{' '}
                  </Text>
                  <button
                    onClick={() => navigate('/signup')}
                    className={cn('SignUpButton')}
                  >
                    <Text fs="12" weight="bold">
                      {t('auth.signUp.link', 'Зарегистрироваться')}
                    </Text>
                  </button>
                </div>
              </div>
            )}

            {/* Fallback */}
            {socialProviders.length === 0 && !showEmailForm && (
              <div className={cn('NoProviders')}>
                <Text fs="14">Нет доступных способов авторизации</Text>
                <Text fs="12">Проверьте настройки провайдеров</Text>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
