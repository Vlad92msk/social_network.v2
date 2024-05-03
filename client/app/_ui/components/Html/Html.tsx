'use client'

import { PropsWithChildren } from 'react'
import { useLocale } from '@hooks'

export function Html(props: PropsWithChildren) {
  const { children } = props
  const locale = useLocale()
  return (
    <html lang={locale}>
      {children}
    </html>
  )
}
