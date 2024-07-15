import { signOut } from 'next-auth/react'
import { Text } from 'app/_ui/common/Text'
import { Icon } from 'app/_ui/common/Icon'
import { Button } from 'app/_ui/common/Button'
import { cn } from '../cn'

export function ButtonLogOut() {
  return (
    <Button
      className={cn('NavigationButton')}
      size="sm"
      onClick={() => signOut()}
    >
      <Icon name="sign-out" />
      <Text
        className={cn('NavigationButtonText')}
        fs={{ es: '14', md: '16' }}
      >
        Выйти
      </Text>
    </Button>
  )
}
