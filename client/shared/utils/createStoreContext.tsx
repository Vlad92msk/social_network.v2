'use client'

import React, { createContext, PropsWithChildren, useCallback, useContext, useRef, useSyncExternalStore } from 'react'
import { DeepPartial } from '@shared/types/DeepPartial'

// function isReact18OrNewer() {
//   return !!React.useSyncExternalStore
// }

export interface Options<Store> {
  initialState: Store;
}

export function createStoreContext<Store>({ initialState: initial }: Options<Store>) {
  const StoreContext = createContext<{
    get:() => Store;
    set: (v: (s: Store) => DeepPartial<Store>) => void;
    subscribe: (callback: VoidFunction) => VoidFunction;
      } | null>(null)

  function useStoreData() {
    const store = useRef<Store>(initial)
    const subscribers = useRef(new Set<VoidFunction>())

    const get = useCallback(() => store.current, [store])
    const set = useCallback((update: (s: Store) => DeepPartial<Store>) => {
      const newState = { ...store.current, ...update(store.current) }
      if (!Object.is(store.current, newState)) {
        store.current = newState
        subscribers.current.forEach((callback) => callback())
      }
    }, [store, subscribers])

    const subscribe = useCallback((callback: VoidFunction) => {
      subscribers.current.add(callback)
      return () => subscribers.current.delete(callback)
    }, [subscribers])

    return { get, set, subscribe }
  }

  function ContextProvider({ children, initialState }: PropsWithChildren<{ initialState?: Partial<Store> }>) {
    const storeData = useStoreData()
    if (initialState) {
      storeData.set(() => initialState)
    }
    return <StoreContext.Provider value={storeData}>{children}</StoreContext.Provider>
  }

  // Для React 18 и новее
  function useStoreSelectorReact18<SelectorOutput>(selector: (store: Store) => SelectorOutput): SelectorOutput {
    const store = useContext(StoreContext)
    if (!store) throw new Error('Store not found')

    return useSyncExternalStore(
      store.subscribe,
      () => selector(store.get()),
      () => selector(store.get()),
    )
  }

  // Для React 17 и старше
  // function useStoreSelectorReact17<SelectorOutput>(selector: (store: Store) => SelectorOutput): SelectorOutput {
  //   const store = useContext(StoreContext)
  //   if (!store) throw new Error('Store not found')
  //
  //   const [state, setState] = useState(() => selector(store.get()))
  //   useEffect(() => {
  //     const unsubscribe = store.subscribe(() => setState(selector(store.get())))
  //     return unsubscribe
  //   }, [selector, store])
  //
  //   return state
  // }

  // const useStoreSelector = isReact18OrNewer() ? useStoreSelectorReact18 : useStoreSelectorReact17
  const useStoreSelector = useStoreSelectorReact18

  function useStoreDispatch() {
    const store = useContext(StoreContext)
    if (!store) throw new Error('Store not found')

    return store.set
  }

  function contextWrapper<SelfComponentProps, PublicContextProps extends Partial<Store>>(
    Module: React.ComponentType<SelfComponentProps & { contextProps?: PublicContextProps }>,
  ) {
    return function ({ contextProps, ...props }: SelfComponentProps & { contextProps?: PublicContextProps }) {
      return (
        <ContextProvider initialState={contextProps}>
          <Module {...props as React.PropsWithChildren<SelfComponentProps>} />
        </ContextProvider>
      )
    }
  }

  return {
    useStoreSelector,
    useStoreDispatch,
    contextWrapper,
  }
}
