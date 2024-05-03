'use client'

import React, { createContext, use, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createChatStore, MessengerChatSlice } from './chat.store'

const MessengerContactsContext = createContext<StoreApi<MessengerChatSlice> | null>(null)

interface CommunicateListProviderProps {
  children: React.ReactNode
}

export function ChatProvider(props: CommunicateListProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerChatSlice>>()
  if (!storeRef.current) {
    storeRef.current = createChatStore(rest)
  }

  return (
    <MessengerContactsContext.Provider value={storeRef.current}>
      {children}
    </MessengerContactsContext.Provider>
  )
}

export const useChatStore = <T, >(selector: (store: MessengerChatSlice) => T): T => {
  const context = use(MessengerContactsContext)
  if (!context) {
    throw new Error('Что-то пошло не так в ChatProvider')
  }
  return useStore(context, selector)
}
