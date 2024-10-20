'use client'

import { useDispatch, useSelector } from 'react-redux'
import { Button } from 'app/_ui/common/Button'
import { cn } from './cn'
import { CreateDialog, DialogList, Search, SwitcherDialogType } from './elements'
import { MessengerSliceActions } from '../../store/messenger.slice'
import { MessengerSelectors } from '../../store/selectors'

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
      <CreateDialog />
    </div>
  )
}
