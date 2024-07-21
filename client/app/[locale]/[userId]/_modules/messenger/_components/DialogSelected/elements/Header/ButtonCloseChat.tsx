import { Icon } from '@ui/common/Icon'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { cn } from './cn'
import { useMessageStore } from '../../../../_providers/message/message.provider'

interface ButtonCloseChatProps {
  className?: string
}

export function ButtonCloseChat(props: ButtonCloseChatProps) {
  const { className } = props

  const handleCloseChat = useMessageStore((state) => state.setChatingPanelStatus)

  return (
    <Button
      className={classNames(cn('ButtonCloseChat'), className)}
      onClick={() => handleCloseChat('close')}
    >
      <Icon name={'close'} />
    </Button>
  )
}
