'use client'

import { NextIntlClientProvider } from 'next-intl'

export const Translation = ({messages, children}) => (
  <NextIntlClientProvider messages={messages}>
    {children}
  </NextIntlClientProvider>
)
