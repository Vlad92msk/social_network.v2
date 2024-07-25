'use client'

import { useState } from 'react'
import { cn } from './cn'
import { ButtonGoTo, ButtonLogOut, SelectLocale, SelectTheme, UserInfo } from './elements'
import { NavigationContentType } from './types'

// interface MainMenuProps {}

const gotoButtons: Record<NavigationContentType, string> = {
  [NavigationContentType.PROFILE]: 'Профиль',
  [NavigationContentType.MUSIC]: 'Музыка',
  [NavigationContentType.VIDEO]: 'Видео',
  [NavigationContentType.PUBLISH]: 'Публикации',
}

export function MainMenu() {
  const [status, setStatus] = useState<'open' | 'close'>('close')

  return (
    <div className={cn({ status })}>
      <UserInfo setStatus={setStatus} />
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
    </div>
  )
}
