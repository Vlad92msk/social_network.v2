'use client'

import { useEffect } from 'react'
import { cn } from './cn'
import { Body, ButtonCloseChat, CallButtons, ContactInfo, Footer } from './elements'
import { useDialogStore } from '../../_providers/dialogSelected'
import { useRootStore } from '../../_providers/root'

interface ChatProps {}

export function DialogSelected(props: ChatProps) {
  const chatingPanelStatus = useRootStore((state) => state.chatingPanelStatus)
  const fetchDialogs = useDialogStore((store) => store.fetchDialogs)

  useEffect(() => {
    // fetchDialogs('1', '2')
  }, [fetchDialogs])

  return (
    <div className={cn({ statusVisible: chatingPanelStatus })}>
      <div className={cn('Header')}>
        <ContactInfo />
        <CallButtons />
        <ButtonCloseChat />
      </div>
      <div className={cn('Body')}>
        <Body />
      </div>
      <div className={cn('Footer')}>
        <Footer />
      </div>
    </div>
  )
}
