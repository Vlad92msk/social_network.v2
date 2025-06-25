import { cn } from './cn.ts'
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
