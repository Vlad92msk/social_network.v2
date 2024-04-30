'use client'

import { ButtonCommon } from '@ui/common/ButtonCommon'
import { cn } from './cn'
import { Contacts, Search, SwitcherGroups } from './elements'
import { useCommunicateListStore } from '../../_providers/communicateList'

interface MessengerProps {}

export function Communicate(props: MessengerProps) {
  // const { } = props

  const status = useCommunicateListStore((state) => state.drawerStatus)
  const setStatus = useCommunicateListStore((state) => state.setDrawerStatus)

  return (
    <div className={cn({ status })}>

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
