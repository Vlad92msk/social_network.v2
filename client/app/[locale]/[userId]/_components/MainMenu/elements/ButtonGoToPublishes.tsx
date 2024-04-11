import { BaseIcon } from '@ui/base/BaseIcon'
import { CommonButton } from '@ui/common/CommonButton'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { cn } from '../cn'

export function ButtonGoToPublishes() {
  return (
  <CommonButton className={cn('NavigationButton')} size="sm">
    <BaseIcon name="git" />
    <CommonText className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>Публикации</CommonText>
  </CommonButton>
  )
}
