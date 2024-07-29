import { Locale } from '@middlewares/variables'
import { PropsWithChildren } from 'react'

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
