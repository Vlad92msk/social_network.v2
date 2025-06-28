import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Icon, Image, Text, TextPropsFontSize } from '@components/ui'
import { makeCn } from '@utils'

import { useAuthActions } from '../../auth'
import { HeaderMenu } from './components/HeaderMenu'
import style from './SignIn.module.scss'

const cn = makeCn('Signin', style)

export function SignIn() {
  const { t } = useTranslation()

  const {
    handleGoogleSignIn,
    handleGitHubSignIn,
    handleMicrosoftSignIn,
    handleAppleSignIn,
    handleFacebookSignIn,
    handleTwitterSignIn,
    handleYahooSignIn,
    isLoading,
    error,
    availableProviders,
    isAuthenticated,
  } = useAuthActions()

  // Мемоизируем настройки шрифта
  const fs: TextPropsFontSize = useMemo(
    () => ({
      xl: '28',
      xs: '14',
      es: '8',
    }),
    [],
  )

  const socialProviders = useMemo(() => {
    const providers = [
      { key: 'google', handler: handleGoogleSignIn, name: 'Google', icon: 'google' },
      { key: 'github', handler: handleGitHubSignIn, name: 'GitHub', icon: 'github' },
      { key: 'microsoft', handler: handleMicrosoftSignIn, name: 'Microsoft', icon: 'microsoft' },
      { key: 'apple', handler: handleAppleSignIn, name: 'Apple', icon: 'apple' },
      { key: 'facebook', handler: handleFacebookSignIn, name: 'Facebook', icon: 'facebook' },
      { key: 'twitter', handler: handleTwitterSignIn, name: 'Twitter', icon: 'twitter' },
      { key: 'yahoo', handler: handleYahooSignIn, name: 'Yahoo', icon: 'yahoo' },
    ]

    return providers.filter((provider) => availableProviders[provider.key as keyof typeof availableProviders] && provider.handler)
  }, [handleGoogleSignIn, handleGitHubSignIn, handleMicrosoftSignIn, handleAppleSignIn, handleFacebookSignIn, handleTwitterSignIn, handleYahooSignIn, availableProviders])

  // Если пользователь авторизован, показываем экран загрузки
  if (isAuthenticated) {
    return (
      <div className={cn('LoadingScreen')}>
        <Text fs="18">Перенаправление...</Text>
        <div className={cn('LoadingSpinner')} />
      </div>
    )
  }

  return (
    <>
      <Image className={cn('BckImage')} alt="bck" width={1800} height={1800} src="base/auth" />
      <HeaderMenu />
      <main className={cn()}>
        <section className={cn('Salutation')}>
          <Text fs={fs} letterSpacing={0.03}>
            Привет! Меня зовут{' '}
          </Text>
          <Text fs={fs} className={cn('MyName')} weight="bold">
            Влад
          </Text>
          <br />
          <Text fs={fs}>Я </Text>
          <Text fs={fs} className={cn('MyPosition')} weight="bold">
            frontend-developer
          </Text>
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
            {socialProviders.map((provider) => (
              <Button key={provider.key} className={cn('EnterButton')} onClick={provider.handler} disabled={isLoading}>
                {isLoading ? (
                  <Text fs="14">Загрузка...</Text>
                ) : (
                  <>
                    <Icon name={provider.icon as any} />
                    <Text fs="14">{t(`auth.signIn.${provider.key}`, provider.name)}</Text>
                  </>
                )}
              </Button>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
