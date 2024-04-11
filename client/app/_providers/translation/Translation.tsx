'use client'

import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'
import { DEFAULT_LOCALE, Locales } from '@middlewares/location'
import { createStoreContext } from '@utils/client'

interface Translation1State {
  locale: Locales,
  messages?: any,
}
const initialState: Translation1State = {
  locale: DEFAULT_LOCALE,
  messages: undefined,
}

export const {
  contextWrapper,
  useStoreSelector: useTranslateSelect,
  useStoreDispatch: useTranslateUpdate,
} = createStoreContext({
  initialState,
})

export const Translation = contextWrapper<PropsWithChildren, Translation1State>(({ children }) => {
  // const router = useRouter()
  // const pathname = usePathname()
  // const locale = useTranslateSelect((s) => s.locale)

  // useEffect(() => {
  //   const localeInUrl = pathname.split('/')[1]
  //
  //   if (localeInUrl !== locale) {
  //     const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${locale}/`)
  //     router.push(newUrl)
  //   }
  // }, [locale, pathname, router])

  return children
})
