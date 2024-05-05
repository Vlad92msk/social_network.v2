'use client'

import { createContext, ReactNode, use, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createContactsStore, MessengerDialogListSlice } from './dialogList.store'

const Context = createContext<StoreApi<MessengerDialogListSlice> | null>(null)

interface ProviderProps {
  children: ReactNode
  dialogsShort: MessengerDialogListSlice['dialogsShort']
}

export function DialogListProvider(props: ProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerDialogListSlice>>()
  if (!storeRef.current) {
    storeRef.current = createContactsStore(rest)
  }

  return (
    <Context.Provider value={storeRef.current}>
      {children}
    </Context.Provider>
  )
}

export const useDialogListStore = <T, >(selector: (store: MessengerDialogListSlice) => T): T => {
  const context = use(Context)
  if (!context) {
    throw new Error('Что-то пошло не так в DialogListProvider')
  }
  return useStore(context, selector)
}
