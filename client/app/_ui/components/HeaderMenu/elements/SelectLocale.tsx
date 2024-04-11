'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChangeEventHandler } from 'react'
import { useLocale } from '@hooks/useLocale'
import { Locales, LOCALES } from '@middlewares/location'
import { useTranslateUpdate } from '@providers/translation'
import { CommonSelect } from '@ui/common/CommonSelect'
import { cn } from '../cn'

export function SelectLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const updateLocation = useTranslateUpdate()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    updateLocation((ctx) => ({ ...ctx, locale: e.target.value as Locales }))
    const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${e.target.value}/`)
    router.push(newUrl)
  }

  return (
    <CommonSelect
      className={cn('SelectLocation')}
      width="auto"
      size="xs"
      placeholder="Выбрать язык"
      defaultValue={currentLocale}
      onChange={handleChangeLocation}
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>{locale}</option>
      ))}
    </CommonSelect>
  )
}
