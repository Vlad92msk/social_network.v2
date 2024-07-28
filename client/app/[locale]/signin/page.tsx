import { Text } from '@ui/common/Text/Text'
import { HeaderMenu } from '@ui/components/HeaderMenu'
import { makeCn } from '@utils/others'
import { useTranslations } from 'next-intl'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default async function SignInPage() {
  // const t = await getServerTranslate()
  // const t = await getTranslations({locale, namespace: 'Metadata'});
  // const t = useTranslations('HomePage');
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
            ллллллл
            {/* {t('Auth.description').split('|').map((part, index, array) => ( */}
            {/*   <> */}
            {/*     {part} */}
            {/*     {index < array.length - 1 && <br />} */}
            {/*   </> */}
            {/* ))} */}
          </Text>
        </section>
        <section className={cn('Enter')}>
          <Text className={cn('EnterText')} fs="14">
            войти
            {/* {t('Auth.enterBy')} */}
          </Text>
          <div className={cn('EnterButtons')}>
            <GoogleSignIn />
          </div>
        </section>
      </main>
    </>
  )
}
