'use client'

import { useEffect } from 'react'
import { Body, ButtonCloseChat, CallButtons, ContactInfo, Footer, Skeleton } from './elements'
import { useMessageStore } from '../../_providers/message/message.provider'

interface ChatProps {}

export function DialogSelected(props: ChatProps) {
  const fetchDialogs = useMessageStore((store) => store.fetchSelectedDialog)
  const openedDialogIds = useMessageStore((state) => state.openedDialogIds)

  // console.log('test', test)

  useEffect(() => {
    if (openedDialogIds[0]) {
      fetchDialogs(openedDialogIds[0])
    }
  }, [fetchDialogs, openedDialogIds])

  return (
    <Skeleton
      renderHeader={(
        <>
          <ContactInfo />
          <CallButtons />
          <ButtonCloseChat />
        </>
      )}
      renderBody={<Body />}
      renderFooter={<Footer />}
    />
  )
}
