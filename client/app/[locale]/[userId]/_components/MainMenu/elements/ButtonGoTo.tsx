import { IconBase } from '@ui/base/IconBase'
import { ButtonCommon } from '@ui/common/ButtonCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from '../cn'
import { useSwitchContent } from '../hooks/useSwitchContent'
import { NavigationContentType } from '../types'

interface ButtonGoToProps {
  title: string
  to: NavigationContentType
}

export function ButtonGoTo(props: ButtonGoToProps) {
  const { to, title } = props
  const switchContent = useSwitchContent()
  return (
    <ButtonCommon
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => {
        switchContent(to)
      }}
    >
      <IconBase name={to} />
      <TextCommon className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>{title}</TextCommon>
    </ButtonCommon>
  )
}
