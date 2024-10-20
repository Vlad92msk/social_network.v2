'use client'

import {
  Body, ButtonCloseChat, CallButtons, ContactInfo, FixedMessages, Footer, InfoButton, InfoPanel, Skeleton, UsersTyping,
} from './elements'

export function DialogSelected() {
  return (
    <Skeleton
      headerComponent={(
        <>
          <ContactInfo />
          <CallButtons />
          <InfoButton />
          <ButtonCloseChat />
        </>
      )}
      bodyComponent={<Body />}
      footerComponent={<Footer />}
      fixedMessages={<FixedMessages />}
      usersTyping={<UsersTyping />}
      infoPanel={<InfoPanel />}
    />
  )
}
