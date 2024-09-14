'use client'

import { cn } from './cn'
import { ButtonExit, SelectLocale, SelectTheme } from './elements'

export function HeaderMenu() {
  return (
    <header className={cn()}>
      <SelectTheme />
      <SelectLocale />
      <ButtonExit />
    </header>
  )
}
