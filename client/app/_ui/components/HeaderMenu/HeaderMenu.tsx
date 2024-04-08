import { cn } from './cn'
import { ButtonExit, SelectLocale, SelectTheme, UserInfo } from './elements'

export function HeaderMenu() {
  return (
    <header className={cn()}>
      <UserInfo />
      <SelectTheme />
      <SelectLocale />
      <ButtonExit />
    </header>
  )
}
