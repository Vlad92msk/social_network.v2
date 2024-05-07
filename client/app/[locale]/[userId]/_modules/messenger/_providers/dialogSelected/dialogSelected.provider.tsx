'use client'

import React, { createContext, use, useRef } from 'react'
import { type StoreApi, useStore } from 'zustand'
import { createDialogStore, MessengerDialogSlice } from './dialogSelected.store'

const Context = createContext<StoreApi<MessengerDialogSlice> | null>(null)

interface ProviderProps {
  children: React.ReactNode
}

export function DialogSelectedProvider(props: ProviderProps) {
  const { children, ...rest } = props

  const storeRef = useRef<StoreApi<MessengerDialogSlice>>()
  if (!storeRef.current) {
    storeRef.current = createDialogStore(rest)
  }

  return (
    <Context.Provider value={storeRef.current}>
      {children}
    </Context.Provider>
  )
}

export const useDialogStore = <T, >(selector: (store: MessengerDialogSlice) => T): T => {
  const context = use(Context)
  if (!context) {
    throw new Error('Что-то пошло не так в DialogSelectedProvider')
  }
  return useStore(context, selector)
}
