'use client'

import { MessengerSliceActions } from '@ui/modules/messenger/store/messenger.slice'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { Button } from 'app/_ui/common/Button'
import { useDispatch, useSelector } from 'react-redux'
import { cn } from './cn'
import { DialogList, Search, SwitcherDialogType } from './elements'

interface MessengerProps {}

export function DialogsDrawerBar(props: MessengerProps) {
  const dispatch = useDispatch()
  const status = useSelector(MessengerSelectors.selectDrawerStatus)
  const chatingPanelStatus = useSelector(MessengerSelectors.selectChatingPanelStatus)
  return (
    <div className={cn({ status, hide: chatingPanelStatus === 'open' })}>

      <SwitcherDialogType className={cn('SwitcherDialogType')} />
      <Search className={cn('Search')} />
      <DialogList className={cn('DialogsDrawerBar')} />

      <Button
        className={cn('ToggleMenu')}
        onClick={() => dispatch(MessengerSliceActions.setDrawerStatus())}
        size="es"
      />
    </div>
  )
}
