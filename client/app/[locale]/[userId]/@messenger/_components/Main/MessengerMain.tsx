'use client'

import { useState } from 'react'
import { ButtonCommon } from '@ui/common/ButtonCommon'
import { cn } from './cn'
import { Contacts, Search, SwitcherGroups } from './elements'

interface MessengerProps {}

export function MessengerMain(props: MessengerProps) {
  const { } = props

  const [status, setStatus] = useState<'open' | 'close'>('open')

  return (
    <div className={cn({ status })}>

      <SwitcherGroups className={cn('SwitcherGroups')} status={status} />
      <Search className={cn('Search')} />
      <Contacts className={cn('Contacts')} status={status} />

      <ButtonCommon
        className={cn('ToggleMenu')}
        onClick={() => setStatus((prev) => (prev === 'open' ? 'close' : 'open'))}
        size="es"
      />
    </div>
  )
}
