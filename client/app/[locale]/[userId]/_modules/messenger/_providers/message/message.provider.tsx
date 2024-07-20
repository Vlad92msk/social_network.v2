'use client'

import { createContext, use, useRef } from 'react'
import { StoreApi, useStore } from 'zustand'
import { createMessengerStore, MessengerState, MessengerStore } from './message.store'

const Context = createContext<StoreApi<MessengerStore> | null>(null)

interface ProviderProps extends Partial<MessengerState> {
  children: React.ReactNode
}

export function MessageProvider(props: ProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerStore>>(null)
  if (!storeRef.current) {
    storeRef.current = createMessengerStore(rest)
  }

  return (
    <Context value={storeRef.current}>
      {children}
    </Context>
  )
}

export const useMessageStore = <T, >(selector: (store: MessengerStore) => T): T => {
  const context = use(Context)
  if (!context) {
    throw new Error('Что-то пошло не так в DialogSelectedProvider')
  }
  return useStore(context, selector)
}
