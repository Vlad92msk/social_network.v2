import { BaseIcon } from '@ui/base/BaseIcon'
import { CommonButton } from '@ui/common/CommonButton'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { cn } from '../cn'

export function GoToProfile() {
  return (
    <CommonButton className={cn('NavigationButton')} size="sm">
      <BaseIcon className={cn('NavigationButtonIcon')} name="git" />
      <CommonText className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>Профиль</CommonText>
    </CommonButton>
  )
}
