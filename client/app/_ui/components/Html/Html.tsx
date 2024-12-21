import { Locale } from '@middlewares/variables'
import { PropsWithChildren } from 'react'

interface HtmlProps extends PropsWithChildren {
  locale: Locale
}

export function Html(props: HtmlProps) {
  const { children, locale } = props
  return (
    <html lang={locale}>
    <head>
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        rel="stylesheet"
      />
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"
        defer
      />
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"
        defer
      />
    </head>
    {children}
    </html>
  )
}
