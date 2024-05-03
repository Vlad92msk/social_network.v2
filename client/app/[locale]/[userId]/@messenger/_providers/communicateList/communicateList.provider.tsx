'use client'

import { createContext, ReactNode, use, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createContactsStore, MessengerCommunicateSlice } from './communicateList.store'

const MessengerContactsContext = createContext<StoreApi<MessengerCommunicateSlice> | null>(null)

interface CommunicateListProviderProps {
  children: ReactNode
  contacts: MessengerCommunicateSlice['contacts']
  groups: MessengerCommunicateSlice['groups']
}

export function CommunicateListProvider(props: CommunicateListProviderProps) {
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

export const useCommunicateListStore = <T, >(selector: (store: MessengerCommunicateSlice) => T): T => {
  const context = use(MessengerContactsContext)
  if (!context) {
    throw new Error('Что-то пошло не так в MessengerContactsProvider')
  }
  return useStore(context, selector)
}
