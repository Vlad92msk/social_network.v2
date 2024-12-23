import { PropsWithChildren } from 'react'
import { Locale } from '@middlewares/variables'

interface HtmlProps extends PropsWithChildren {
  locale: Locale
}

export function Html(props: HtmlProps) {
  const { children, locale } = props
  return (
    <html lang={locale}>
      {children}
    </html>
  )
}
