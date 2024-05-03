'use client'

import { cn } from './cn'
import { Body, ButtonCloseChat, CallButtons, ContactInfo, Footer } from './elements'
import { useRootStore } from '../../_providers/root'

interface ChatProps {}

export const Chat = (props: ChatProps) => {
  const chatingPanelStatus = useRootStore((state) => state.chatingPanelStatus)

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
