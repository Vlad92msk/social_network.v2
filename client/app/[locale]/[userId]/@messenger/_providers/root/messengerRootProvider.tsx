'use client'

import React, { createContext, useContext, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createContactsStore, MessengerRootSlice } from './root.store'

const MessengerRootContext = createContext<StoreApi<MessengerRootSlice> | null>(null)

interface RootProviderProps {
  children: React.ReactNode
}

export function MessengerRootProvider(props: RootProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerRootSlice>>()
  if (!storeRef.current) {
    storeRef.current = createContactsStore(rest)
  }

  return (
    <MessengerRootContext.Provider value={storeRef.current}>
      {children}
    </MessengerRootContext.Provider>
  )
}

export const useRootStore = <T, >(selector: (store: MessengerRootSlice) => T): T => {
  const context = useContext(MessengerRootContext)
  if (!context) {
    throw new Error('Что-то пошло не так в RootProvider')
  }
  return useStore(context, selector)
}
