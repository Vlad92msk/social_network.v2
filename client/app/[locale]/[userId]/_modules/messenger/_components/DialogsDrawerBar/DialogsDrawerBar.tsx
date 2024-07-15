'use client'

import { Button } from 'app/_ui/common/Button'
import { cn } from './cn'
import { DialogList, Search, SwitcherDialogType } from './elements'
import { useRootStore } from '../../_providers/root'

interface MessengerProps {}

export function DialogsDrawerBar(props: MessengerProps) {
  // const { } = props

  const status = useRootStore((state) => state.drawerStatus)
  const setStatus = useRootStore((state) => state.setDrawerStatus)
  const chatingPanelStatus = useRootStore((state) => state.chatingPanelStatus)

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
