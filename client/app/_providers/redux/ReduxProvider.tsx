'use client'

import { PropsWithChildren, useRef } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { RootReducer } from '../../../store/root.reducer'
import { AppStore, makeStore, persistor } from '../../../store/store'

export function ReduxProvider(props: PropsWithChildren<Partial<RootReducer>>) {
  const { children, ...preloadedState } = props
  const storeRef = useRef<AppStore>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore(preloadedState)
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
