import { IconBase } from 'app/_ui/base/IconBase'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon/TextCommon'
import { cn } from '../cn'

export function ButtonGoToPublishes() {
  return (
  <ButtonCommon className={cn('NavigationButton')} size="sm">
    <IconBase name="git" />
    <TextCommon className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>Публикации</TextCommon>
  </ButtonCommon>
  )
}
