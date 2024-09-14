import { Locale } from '@middlewares/variables'
import { ReduxProvider } from '@providers/redux'
import { Session } from '@providers/session/Session'
import { ThemeService } from '@providers/theme'
import { Body } from '@ui/components/Body'
import { Html } from '@ui/components/Html'
import '@ui/styles/_index.scss'
import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'

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

  // const d = await profileApiInstance.getProfiles().then(response => response.data)
  // const d2 = await profileApiInstance.getProfileInfo({body:{email: 'fvsasus@gmail.com'}}).then(response => response.data)
  // const d1 = await userInfoApiInstance.getUsers().then(response => response.data)
  // console.log('d', d)
  // console.log('d1', d1)
  // console.log('d2', d2)

  return (
    <ReduxProvider>
      <ThemeService contextProps={{ theme: 'default' }}>
        <NextIntlClientProvider messages={messages}>
          <Html locale={params.locale}>
            <Session>
              <Body>
                <div>
                  {/* {JSON.stringify(d)} */}
                  {/* {JSON.stringify(d1)} */}
                </div>
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
