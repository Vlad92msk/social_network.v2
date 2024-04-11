import { CommonText } from '@ui/common/CommonText/CommonText'
import { HeaderMenu } from '@ui/components/HeaderMenu'
import { makeCn } from '@utils/others'
import { getServerTranslate } from '@utils/server'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default async function SignInPage() {
  const t = await getServerTranslate()

  return (
    <>
      <HeaderMenu />
      <main className={cn()}>
        <section className={cn('Salutation')}>
          <CommonText
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
          </CommonText>
        </section>
        <section className={cn('Enter')}>
          <CommonText className={cn('EnterText')} fs="14">
            {t('Auth.enterBy')}
          </CommonText>
          <div className={cn('EnterButtons')}>
            <GoogleSignIn />
          </div>
        </section>
      </main>
    </>
  )
}
