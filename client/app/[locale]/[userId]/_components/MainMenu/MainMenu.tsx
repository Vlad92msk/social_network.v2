'use client'

import { useMemo, useState } from 'react'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { cn } from './cn'
import { ButtonGoTo, ButtonLogOut, SelectLocale, SelectTheme, UserInfo } from './elements'
import { NavigationContentType } from './types'

export interface MainMenuProps {}


export function MainMenu() {
  const [status, setStatus] = useState<'open' | 'close'>('open')
  const gotoButtons: Record<NavigationContentType, string> = {
    [NavigationContentType.PROFILE]: 'Профиль',
    [NavigationContentType.MUSIC]: 'Музыка',
    [NavigationContentType.VIDEO]: 'Видео',
    [NavigationContentType.PUBLISH]: 'Публикации',
  }

  return (
    <div className={cn({ status })}>
      {useMemo(() => (
        <>
          <UserInfo />
          <div className={cn('NavigationButtonsGroup')}>
            <ButtonGoTo to={NavigationContentType.PROFILE} title={gotoButtons[NavigationContentType.PROFILE]} />
            <ButtonGoTo to={NavigationContentType.PUBLISH} title={gotoButtons[NavigationContentType.PUBLISH]} />
            <ButtonGoTo to={NavigationContentType.MUSIC} title={gotoButtons[NavigationContentType.MUSIC]} />
            <ButtonGoTo to={NavigationContentType.VIDEO} title={gotoButtons[NavigationContentType.VIDEO]} />
          </div>
          <div className={cn('SettingsButtonsGroup')}>
            <SelectTheme />
            <SelectLocale />
            <ButtonLogOut />
          </div>
        </>
      ), [gotoButtons])}
      <ButtonCommon
        className={cn('ToggleMenu')}
        onClick={() => setStatus((prev) => (prev === 'open' ? 'close' : 'open'))}
        size="es"
      />
    </div>
  )
}
