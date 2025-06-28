import { Icon } from '../../../ui'
import { Button } from '../../../ui/common/Button'
import { Text } from '../../../ui/common/Text'
import { cn } from '../cn'
import { NavigationContentType } from '../types'

interface ButtonGoToProps {
  title: string
  to: NavigationContentType
}

export function ButtonGoTo(props: ButtonGoToProps) {
  const { to, title } = props

  return (
    <Button
      className={cn('NavigationButton', { active: true })}
      size="sm"
    >
      <Icon name={to} />
      <Text className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>{title}</Text>
    </Button>
  )
}
