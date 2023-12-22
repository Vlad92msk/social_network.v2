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

export default async function RootLayout({ children }) {
  return (
    <Html>
      <ThemeService>
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
