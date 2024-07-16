'use client'

import { useEffect } from 'react'
import { cn } from './cn'
import { Body, ButtonCloseChat, CallButtons, ContactInfo, Footer } from './elements'
import { useMessageStore } from '../../_providers/message/message.provider'

interface ChatProps {}

export function DialogSelected(props: ChatProps) {
  const chatingPanelStatus = useMessageStore((state) => state.chatingPanelStatus)
  const fetchDialogs = useMessageStore((store) => store.fetchSelectedDialog)
  const openedDialogIds = useMessageStore((state) => state.openedDialogIds)

  // console.log('test', test)

  useEffect(() => {
    if (openedDialogIds[0]) {
      fetchDialogs(openedDialogIds[0])
    }
  }, [fetchDialogs, openedDialogIds])

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
