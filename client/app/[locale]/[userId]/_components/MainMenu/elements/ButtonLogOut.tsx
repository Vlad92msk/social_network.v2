import { signOut } from 'next-auth/react'
import { IconBase } from 'app/_ui/base/IconBase'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon/TextCommon'
import { cn } from '../cn'

export function ButtonLogOut() {
  return (
    <ButtonCommon
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => signOut()}
    >
      <IconBase name="git" />
      <TextCommon
        className={cn('NavigationButtonText')}
        fs={{ es: '14', md: '16' }}
      >
        Выйти
      </TextCommon>
    </ButtonCommon>
  )
}
