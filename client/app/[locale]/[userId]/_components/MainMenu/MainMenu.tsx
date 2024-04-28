'use client'

import { useMemo, useState } from 'react'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { cn } from './cn'
import {
  ButtonGoToPublishes, ButtonLogOut, GoToMusic, GoToProfile, GoToVideos, SelectLocale, SelectTheme, UserInfo,
} from './elements'

export interface MainMenuProps {}

export function MainMenu() {
  const [status, setStatus] = useState<'open' | 'close'>('open')

  return (
    <div className={cn({ status })}>
      {useMemo(() => (
        <>
          <UserInfo />
          <div className={cn('NavigationButtonsGroup')}>
            <GoToProfile />
            <ButtonGoToPublishes />
            <GoToMusic />
            <GoToVideos />
          </div>
          <div className={cn('SettingsButtonsGroup')}>
            <SelectTheme />
            <SelectLocale />
            <ButtonLogOut />
          </div>
        </>
      ), [])}
      <ButtonCommon
        className={cn('ToggleMenu')}
        onClick={() => setStatus((prev) => (prev === 'open' ? 'close' : 'open'))}
        size="es"
      />
    </div>
  )
}
