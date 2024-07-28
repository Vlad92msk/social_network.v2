import { Icon } from 'app/_ui/common/Icon'
import { Button } from 'app/_ui/common/Button'
import { Text } from 'app/_ui/common/Text'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const { 3: contentType } = pathname.split('/')

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
