import { Locale } from '@middlewares/variables'
import { NotificationsProvider } from '@providers/notifications/NotificationsProvider'
import { ReduxProvider } from '@providers/redux'
import { SessionProvider } from '@providers/session/SessionProvider'
import { ThemeProvider } from '@providers/theme'
import { Body } from '@ui/components/Body'
import { Html } from '@ui/components/Html'
import '@ui/styles/_index.scss'
import 'draft-js/dist/Draft.css'
import { getServerProfile } from '@utils/server'
import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

export async function generateMetadata(props) {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const meta: Metadata = {
    title: t('title'),
  }

  return meta
}

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}
export default async function RootLayout(props: RootLayoutProps) {
  const { children } = props
  // Дожидаемся разрешения params перед использованием
  const resolvedParams = await props.params
  const { locale } = resolvedParams

  // Теперь передаем разрешенную локаль в getMessages
  const messages = await getMessages({ locale })
  const profile = await getServerProfile()

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider contextProps={{ theme: 'default' }}>
        <Html locale={locale}>
          <Body>
            <SessionProvider>
              <ReduxProvider profile={{ profile }}>
                <NotificationsProvider>
                  {children}
                </NotificationsProvider>
              </ReduxProvider>
            </SessionProvider>
          </Body>
        </Html>
      </ThemeProvider>
    </NextIntlClientProvider>
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
