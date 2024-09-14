'use client'

import { PropsWithChildren, useRef } from 'react'
import { Provider } from 'react-redux'
import { RootReducer } from '../../_store/root.reducer'
import { AppStore, makeStore } from '../../_store/store'

export function ReduxProvider(props: PropsWithChildren<Partial<RootReducer>>) {
  const {children, ...preloadedState} = props
  const storeRef = useRef<AppStore>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore(preloadedState)
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
