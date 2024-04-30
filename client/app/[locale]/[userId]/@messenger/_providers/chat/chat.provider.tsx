'use client'

import React, { createContext, useContext, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createContactsStore, MessengerCommunicateSlice } from './chat.store'

const MessengerContactsContext = createContext<StoreApi<MessengerCommunicateSlice> | null>(null)

interface CommunicateListProviderProps {
  children: React.ReactNode
}

export function ChatProvider(props: CommunicateListProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerCommunicateSlice>>()
  if (!storeRef.current) {
    storeRef.current = createContactsStore(rest)
  }

  return (
    <MessengerContactsContext.Provider value={storeRef.current}>
      {children}
    </MessengerContactsContext.Provider>
  )
}

export const useChatStore = <T, >(selector: (store: MessengerCommunicateSlice) => T): T => {
  const context = useContext(MessengerContactsContext)
  if (!context) {
    throw new Error('Что-то пошло не так в MessengerContactsProvider')
  }
  return useStore(context, selector)
}
