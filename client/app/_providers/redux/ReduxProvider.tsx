'use client'

import { PropsWithChildren, useRef } from 'react'
import { Provider } from 'react-redux'
import { AppStore, makeStore } from '../../_store/store'

export function ReduxProvider(props: PropsWithChildren) {
  const storeRef = useRef<AppStore>(null)
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{props.children}</Provider>
}
