import { Button, Icon } from '@components/ui'

import { useAuthActions } from '../../../auth'

interface GoogleSignInProps {
  className?: string
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const { className } = props
  const { handleGoogleSignIn, isLoading } = useAuthActions()

  return (
    <Button className={className} onClick={handleGoogleSignIn} disabled={isLoading}>
      <Icon name="google" />
      {isLoading ? 'Загрузка...' : 'Google'}
    </Button>
  )
}
