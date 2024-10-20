
import { Icon } from '@ui/common/Icon'
import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { useDispatch } from 'react-redux'
import { cn } from './cn'

export const CloseButton = () => {
  const dispatch = useDispatch()
  return (
    <button
      className={cn('CloseButton')}
      onClick={() => {
        dispatch(MessengerSliceActions.setInfoPanelStatus())
      }}
    >
      <Icon name="close"/>
    </button>
  )
}
