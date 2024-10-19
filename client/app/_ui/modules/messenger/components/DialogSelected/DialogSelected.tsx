'use client'

import {
  Body, ButtonCloseChat, CallButtons, ContactInfo, FixedMessages, Footer, Skeleton, UsersTyping
} from './elements'

interface ChatProps {}

export function DialogSelected(props: ChatProps) {
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
      usersTyping={<UsersTyping />}
    />
  )
}
