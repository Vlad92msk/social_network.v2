import { Locale } from '@middlewares/variables'
import { ReduxProvider } from '@providers/redux'
import { Session } from '@providers/session/Session'
import { ThemeService } from '@providers/theme'
import { CookieType } from '../types/cookie'
import { Body } from '@ui/components/Body'
import { Html } from '@ui/components/Html'
import '@ui/styles/_index.scss'
import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'

import { getMessages, getTranslations } from 'next-intl/server'

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const meta: Metadata = {
    title: t('title'),
  }

  return meta
}
interface RootLayoutProps {
  children: React.ReactNode;
  params: {locale: Locale};
}
export default async function RootLayout(props: RootLayoutProps) {
  const { children, params } = props
  const messages = await getMessages()
  const cookieStore = cookies()
  const USER_PROFILE = cookieStore.get(CookieType.USER_PROFILE)?.value

  return (
    <ReduxProvider profile={USER_PROFILE && JSON.parse(USER_PROFILE)}>
      <ThemeService contextProps={{ theme: 'default' }}>
        <NextIntlClientProvider messages={messages}>
          <Html locale={params.locale}>
            <Session>
              <Body>
                {children}
              </Body>
            </Session>
          </Html>
        </NextIntlClientProvider>
      </ThemeService>
    </ReduxProvider>
  )
}

//
// const wait = (ms: number): Promise<void> => new Promise((resolve) => {
//   console.log('запускаем таймер')
//   setTimeout(() => {
//     console.log('Таймер завершен')
//     resolve()
//   }, ms * 1000)
// })
//
// const chucknorris = () => fetch('https://api.chucknorris.io/jokes/random')
//   .then((response) => response.json())
//   .catch((error) => console.error(error))
//
// const pokemon = (id: number) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
//   .then((response) => response.json())
//   .catch((error) => console.error(error))
//
// const pokemon1 = async (id: number) => {
//   const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
//
//   return res.json()
// }
