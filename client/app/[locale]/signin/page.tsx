import { getTranslations } from 'next-intl/server'
import { Text } from '@ui/common/Text/Text'
import { HeaderMenu } from 'app/[locale]/signin/components/HeaderMenu'
import { makeCn } from '@utils/others'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default async function SignInPage() {
  const t = await getTranslations()
  return (
    <>
      <HeaderMenu />
      <main className={cn()}>
        <section className={cn('Salutation')}>
          <Text
            fs={{
              xl: '44',
              xs: '38',
              sm: '20',
              es: '8',
            }}
            letterSpacing={0.03}
          >
            {t('Auth.description').split('|').map((part, index, array) => (
              <>
                {part}
                {index < array.length - 1 && <br />}
              </>
            ))}
          </Text>
        </section>
        <section className={cn('Enter')}>
          <Text className={cn('EnterText')} fs="14">
            {t('Auth.enterBy')}
          </Text>
          <div className={cn('EnterButtonsList')}>
            <GoogleSignIn className={cn('EnterButton')} />
          </div>
        </section>
      </main>
    </>
  )
}
