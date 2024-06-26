import { signOut } from 'next-auth/react'
import { TextCommon } from '@ui/common/TextCommon'
import { IconBase } from 'app/_ui/base/IconBase'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { cn } from '../cn'

export function ButtonLogOut() {
  return (
    <ButtonCommon
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => signOut()}
    >
      <IconBase name="sign-out" />
      <TextCommon
        className={cn('NavigationButtonText')}
        fs={{ es: '14', md: '16' }}
      >
        Выйти
      </TextCommon>
    </ButtonCommon>
  )
}
