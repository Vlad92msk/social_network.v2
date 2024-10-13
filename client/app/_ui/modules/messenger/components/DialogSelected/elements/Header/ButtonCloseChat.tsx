import { Icon } from '@ui/common/Icon'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { useDispatch } from 'react-redux'
import { cn } from './cn'

interface ButtonCloseChatProps {
  className?: string
}

export function ButtonCloseChat(props: ButtonCloseChatProps) {
  const { className } = props
  const dispatch = useDispatch()

  return (
    <Button
      className={classNames(cn('ButtonCloseChat'), className)}
      onClick={() => dispatch(MessengerSliceActions.setChattingPanelStatus('close'))}
    >
      <Icon name="close" />
    </Button>
  )
}
