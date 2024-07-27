'use client'

import { useEffect } from 'react'
import {
  Body, ButtonCloseChat, CallButtons, ContactInfo, FixedMessages, Footer, Skeleton,
} from './elements'
import { useMessageStore } from '../../store'

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
      headerComponent={(
        <>
          <ContactInfo />
          <CallButtons />
          <ButtonCloseChat />
        </>
      )}
      bodyComponent={<Body />}
      footerComponent={<Footer />}
      fixedMessages={<FixedMessages />}
    />
  )
}
