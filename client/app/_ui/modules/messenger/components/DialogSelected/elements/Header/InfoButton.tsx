import { useDispatch } from 'react-redux'
import { Icon } from '@ui/common/Icon'
import { cn } from './cn'
import { MessengerSliceActions } from '../../../../store/messenger.slice'

export function InfoButton() {
  const dispatch = useDispatch()

  return (
    <button
      className={cn('InfoButton')}
      onClick={() => {
        dispatch(MessengerSliceActions.setInfoPanelStatus())
      }}
    >
      <Icon name="menu-list" />
    </button>
  )
}
