import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '@ui/common/Icon'
import { MessengerThunkActions } from '@ui/modules/messenger/store/actions'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { classNames } from '@utils/others'
import { Button } from 'app/_ui/common/Button'
import { cn } from './cn'

interface ButtonCloseChatProps {
  className?: string
}

export function ButtonCloseChat(props: ButtonCloseChatProps) {
  const { className } = props
  const dispatch = useDispatch()
  const currentDialogId = useSelector(MessengerSelectors.selectCurrentDialogId)

  return (
    <Button
      className={classNames(cn('ButtonCloseChat'), className)}
      onClick={() => {
        dispatch(MessengerSliceActions.setChattingPanelStatus('close'))
        dispatch(MessengerThunkActions.leaveFromDialog(currentDialogId))
      }}
    >
      <Icon name="close" />
    </Button>
  )
}
