'use client'

import { useLocale } from '@hooks/useLocale'
import { LOCALES, Locales } from '@middlewares/location'
import { useThemeServiceUpdate } from '@providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '@providers/theme/context/initialState'
import { useTranslateUpdate } from '@providers/translation'
import { ChangeEventHandler } from 'react'
import { CommonSelect } from 'app/_ui/common/CommonSelect'
import { cn } from './cn'

export function SettingsMenu() {
  const currentLocale = useLocale()
  const updateTheme = useThemeServiceUpdate()
  const updateLocation = useTranslateUpdate()

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }
  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    updateLocation((ctx) => ({ ...ctx, locale: e.target.value as Locales }))
  }
  return (
    <header className={cn('SettingsMenu')}>
      <CommonSelect
        className={cn('SelectTheme')}
        width="auto"
        size="xs"
        placeholder="Выбрать тему"
        defaultValue={DEFAULT_THEME}
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
