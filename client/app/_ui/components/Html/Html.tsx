'use client'

import { useLocale } from 'next-intl'
import { PropsWithChildren } from 'react'

export function Html(props: PropsWithChildren) {
  const { children } = props
  const locale = useLocale()

  return (
    <html lang={locale}>
      {children}
    </html>
  )
}
