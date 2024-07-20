'use client'

import { Button } from 'app/_ui/common/Button'
import { cn } from './cn'
import { DialogList, Search, SwitcherDialogType } from './elements'
import { useMessageStore } from '../../_providers/message/message.provider'

interface MessengerProps {}

export function DialogsDrawerBar(props: MessengerProps) {
  // const { } = props

  const status = useMessageStore((state) => state.drawerStatus)
  const setStatus = useMessageStore((state) => state.setDrawerStatus)
  const chatingPanelStatus = useMessageStore((state) => state.chatingPanelStatus)
console.log('chatingPanelStatus', chatingPanelStatus)
  return (
    <div className={cn({ status, hide: chatingPanelStatus === 'open' })}>

      <SwitcherDialogType className={cn('SwitcherDialogType')} />
      <Search className={cn('Search')} />
      <DialogList className={cn('DialogsDrawerBar')} />

      <Button
        className={cn('ToggleMenu')}
        onClick={() => setStatus(status === 'open' ? 'close' : 'open')}
        size="es"
      />
    </div>
  )
}
