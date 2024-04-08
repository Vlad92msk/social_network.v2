'use client'

import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { ChangeEventHandler } from 'react'
import { useLocale } from '@hooks/useLocale'
import { LOCALES, Locales } from '@middlewares/location'
import { useThemeServiceUpdate } from '@providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '@providers/theme/context/initialState'
import { useTranslateUpdate } from '@providers/translation'
import { CommonButton } from '@ui/common/CommonButton'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { rem } from '@utils/others'
import { CommonSelect } from 'app/_ui/common/CommonSelect'
import { cn } from './cn'
import Loading from './loading'

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

  const { data, status } = useSession()

  return (
    <header className={cn('SettingsMenu')}>
      <div style={{ marginRight: 'auto', display: 'flex', height: '100%', width: rem(35), padding: '5px 0', gap: '5px' }}>
        {
          status === 'loading' ? <Loading /> : status === 'authenticated' ? (
            <>
              {data?.user?.image && (<Image src={data.user.image} alt="me" width={50} height={50} />)}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-expect-error */}
              <CommonText style={{ width: '100px', 'text-wrap': 'nowrap' }} fs="12">
                {data?.user?.name}
              </CommonText>
            </>
          ) : undefined
        }
      </div>
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
      {status === 'authenticated' && (
        <CommonButton onClick={() => signOut()} size="xs">
          Выйти
        </CommonButton>
      )}
    </header>
  )
}
