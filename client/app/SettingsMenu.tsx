'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import React, { ChangeEventHandler } from 'react'
import { useThemeServiceSelect, useThemeServiceUpdate } from '@services/theme'
import { DEFAULT_THEME, Theme, THEMES } from '@services/theme/context/initialState'
import { CommonSelect } from 'app/_ui/common/CommonSelect'
import { cn } from './cn'
import { LOCALES, Locales } from '../middlwares/location'

export function SettingsMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const updateTheme = useThemeServiceUpdate()
  const currentTheme = useThemeServiceSelect((s) => s.theme)

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const locale = e.target.value as Locales
    const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${locale}/`)
    router.push(newUrl)
  }
  return (
    <header className={cn('SettingsMenu')}>
      <CommonSelect
        className={cn('SelectTheme')}
        width="auto"
        size="xs"
        placeholder="Выбрать тему"
        defaultValue={DEFAULT_THEME}
        value={currentTheme}
        onChange={handleChangeTheme}

      >
        {THEMES.map((theme) => (
          <option key={theme} value={theme}>{theme}</option>
        ))}
      </CommonSelect>
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
    </header>
  )
}
