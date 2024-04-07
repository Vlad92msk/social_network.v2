import { Metadata } from 'next'
import { ChakraUI } from '@services/chakraUI/ChakraUI'
import { Session } from '@services/session/Session'
import { ThemeService } from '@services/theme'
import { Translation } from '@services/translation'
import { Body } from '@ui/components/Body'
import { Html } from '@ui/components/Html'
import './_ui/styles/_index.scss'
import { getTranslate } from './_utils/server/getTranslate'
import { SettingsMenu } from './SettingsMenu'

export async function generateMetadata() {
  const t = await getTranslate()
  const meta: Metadata = {
    title: t('Metadata.title'),
  }

  return meta
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => {
  console.log('запускаем таймер')
  setTimeout(() => {
    console.log('Таймер завершен')
    resolve()
  }, ms * 1000)
})

const chucknorris = () => fetch('https://api.chucknorris.io/jokes/random')
  .then((response) => response.json())
  .catch((error) => console.error(error))

const pokemon = (id: number) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  .then((response) => response.json())
  .catch((error) => console.error(error))

const pokemon1 = async (id: number) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)

  return res.json()
}

export default async function RootLayout({ children }) {
  const wed = await pokemon1(3)
  console.log('wed', wed.name)
  const chhh = await chucknorris()
  console.log('chhh', chhh.id)

  const all = await Promise.all([
    pokemon1(3),
    chucknorris(),
  ])

  console.log('all', all)

  return (
    <Html>
      <ThemeService contextProps={{ theme: 'default' }}>
        <Translation>
          <Session>
            <Body>
              <ChakraUI>
                <SettingsMenu />
                {children}
              </ChakraUI>
            </Body>
          </Session>
        </Translation>
      </ThemeService>
    </Html>
  )
}
