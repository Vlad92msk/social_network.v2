import { useLocation } from 'react-router-dom'
import { Button } from '../../../common/Button'
import { Text } from '../../../common/Text'
import { Icon } from '../../../icon'
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
  const location = useLocation()
  const pathSegments = location.pathname.split('/')
  const contentType = pathSegments[3]

  return (
    <Button
      className={cn('NavigationButton', { active: contentType === to })}
      size="sm"
      onClick={() => {
        switchContent(to)
      }}
    >
      <Icon name={to} />
      <Text className={cn('NavigationButtonText')} fs={{ es: '14', md: '16' }}>{title}</Text>
    </Button>
  )
}
