import { Metadata } from 'next'
import './_ui/styles/_index.scss'
import { Session } from '@services/session/Session'
import { ThemeService } from '@services/theme'
import { Translation } from '@services/translation/Translation'
import { getLocale } from './_utils/getLocale'
import { getTranslate } from './_utils/getTranslate'

export async function generateMetadata() {
  const t = await getTranslate()
  const meta: Metadata = {
    title: t('Metadata.title'),
  }

  return meta
}

export default async function RootLayout({ children }) {
  const locale = getLocale()
  return (
    <html lang={locale}>
      <ThemeService>
        <Translation>
          <Session>
            <body>{children}</body>
          </Session>
        </Translation>
      </ThemeService>
    </html>
  )
}
