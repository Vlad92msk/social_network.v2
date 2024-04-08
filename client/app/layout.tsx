import { Metadata } from 'next'
import { ChakraUI } from '@providers/chakraUI/ChakraUI'
import { Session } from '@providers/session/Session'
import { ThemeService } from '@providers/theme'
import { Translation } from '@providers/translation'
import { Body } from '@ui/components/Body'
import { Html } from '@ui/components/Html'
import './_ui/styles/_index.scss'
import { getMessages } from '@utils/others'
import { getServerLocale, getServerTranslate } from '@utils/server'
import { SettingsMenu } from './SettingsMenu'

export async function generateMetadata() {
  const t = await getServerTranslate()
  const meta: Metadata = {
    title: t('Metadata.title'),
  }

  return meta
}

export default async function RootLayout({ children }) {
  const locale = getServerLocale()
  const messages = await getMessages(locale)


  return (
    <Translation contextProps={{ locale, messages }}>
      <ThemeService contextProps={{ theme: 'default' }}>
        <Html>
          <Session>
            <Body>
              <ChakraUI>
                <SettingsMenu />
                {children}
              </ChakraUI>
            </Body>
          </Session>
        </Html>
      </ThemeService>
    </Translation>
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
