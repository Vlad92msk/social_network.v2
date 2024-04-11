import { signOut } from 'next-auth/react'
import { BaseIcon } from '@ui/base/BaseIcon'
import { CommonButton } from '@ui/common/CommonButton'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { cn } from '../cn'

export function ButtonLogOut() {
  return (
    <CommonButton
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => signOut()}
    >
      <BaseIcon name="git" />
      <CommonText
        className={cn('NavigationButtonText')}
        fs={{ es: '14', md: '16' }}
      >
        Выйти
      </CommonText>
    </CommonButton>
  )
}
