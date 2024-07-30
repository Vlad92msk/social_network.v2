import { getTranslations } from 'next-intl/server'
import { Image } from '@ui/common/Image'
import { Text, TextPropsFontSize } from '@ui/common/Text/Text'
import { makeCn } from '@utils/others'
import { HeaderMenu } from 'app/[locale]/signin/components/HeaderMenu'
import { GoogleSignIn } from './components'
import style from './page.module.scss'

const cn = makeCn('Signin', style)

export default async function SignInPage() {
  const fs: TextPropsFontSize = {
    xl: '28',
    xs: '14',
    es: '8',
  }

  const t = await getTranslations()
  return (
    <>
      <Image className={cn('BckImage')} alt="bck" width={1800} height={1800} src="base/auth" />
      <HeaderMenu />
      <main className={cn()}>
        <section className={cn('Salutation')}>
          <Text fs={fs} letterSpacing={0.03}>
            Привет! Меня зовут {' '}
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
