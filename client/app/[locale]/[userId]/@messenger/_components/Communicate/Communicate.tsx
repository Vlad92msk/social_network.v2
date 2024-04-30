'use client'

import { ButtonCommon } from '@ui/common/ButtonCommon'
import { cn } from './cn'
import { Contacts, Search, SwitcherGroups } from './elements'
import { useRootStore } from '../../_providers/root'

interface MessengerProps {}

export function Communicate(props: MessengerProps) {
  // const { } = props

  const status = useRootStore((state) => state.drawerStatus)
  const setStatus = useRootStore((state) => state.setDrawerStatus)
  const chatingPanelStatus = useRootStore((state) => state.chatingPanelStatus)

  return (
    <div className={cn({ status, hide: chatingPanelStatus === 'open' })}>

      <SwitcherGroups className={cn('SwitcherGroups')} />
      <Search className={cn('Search')} />
      <Contacts className={cn('Contacts')} />

      <ButtonCommon
        className={cn('ToggleMenu')}
        onClick={() => setStatus(status === 'open' ? 'close' : 'open')}
        size="es"
      />
    </div>
  )
}
