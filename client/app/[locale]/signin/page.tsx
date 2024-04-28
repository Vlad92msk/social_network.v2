import { TextCommon } from '@ui/common/TextCommon/TextCommon'
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
          <TextCommon
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
          </TextCommon>
        </section>
        <section className={cn('Enter')}>
          <TextCommon className={cn('EnterText')} fs="14">
            {t('Auth.enterBy')}
          </TextCommon>
          <div className={cn('EnterButtons')}>
            <GoogleSignIn />
          </div>
        </section>
      </main>
    </>
  )
}
