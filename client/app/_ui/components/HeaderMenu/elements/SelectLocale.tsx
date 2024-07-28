'use client'

import { LOCALES } from '@middlewares/variables'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { ChangeEventHandler } from 'react'
// import { useTranslateUpdate } from '@providers/translation'
import { Select } from 'app/_ui/common/Select'
import { cn } from '../cn'

export function SelectLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    // updateLocation((ctx) => ({ ...ctx, locale: e.target.value as Locales }))
    const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${e.target.value}/`)
    router.push(newUrl)
  }

  return (
    <Select
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
    </Select>
  )
}
