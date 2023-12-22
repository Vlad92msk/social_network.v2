'use client'

import { useLocale } from 'next-intl'
import { PropsWithChildren } from 'react'

export function Html(props: PropsWithChildren) {
  const locale = useLocale()

  return (
    <html lang={locale}>
      {props.children}
    </html>
  )
}
