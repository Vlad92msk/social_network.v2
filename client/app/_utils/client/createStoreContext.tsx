'use client'

import { cloneDeep, merge } from 'lodash'
import { ComponentType, createContext, PropsWithChildren, use, useRef, useSyncExternalStore } from 'react'
import { DeepPartial } from '../tsUtils'

export interface Options<Store> {
  initialState: Store;
}

export function createStoreContext<Store>({ initialState: initial }: Options<Store>) {
  const StoreContext = createContext<{
    get:() => Store
    set: (v: (s: Store) => DeepPartial<Store>) => void
    subscribe: (callback: VoidFunction) => VoidFunction
      } | null>(null)

  function useStoreData() {
    const store = useRef<Store>(initial)
    const subscribers = useRef(new Set<VoidFunction>())

    const get = () => store.current

    const set = (update: (s: Store) => Partial<Store>) => {
      const newState = merge(cloneDeep(store.current), update(store.current))
      if (!Object.is(store.current, newState)) {
        store.current = newState
        subscribers.current.forEach((callback) => callback())
      }
    }

    const subscribe = (callback: VoidFunction) => {
      subscribers.current.add(callback)
      return () => subscribers.current.delete(callback)
    }

    return { get, set, subscribe }
  }

  function ContextProvider({ children, initialState }: PropsWithChildren<{ initialState?: Partial<Store> }>) {
    const storeData = useStoreData()
    if (initialState) {
      storeData.set(() => initialState)
    }
    return <StoreContext value={storeData}>{children}</StoreContext>
  }

  // Для React 18 и новее
  function useStoreSelectorReact18<SelectorOutput>(selector: (store: Store) => SelectorOutput): SelectorOutput {
    const store = use(StoreContext)
    if (!store) throw new Error('Store not found')

    return useSyncExternalStore(
      store.subscribe,
      () => selector(store.get()),
      () => selector(store.get()),
    )
  }

  function useStoreDispatch() {
    const store = use(StoreContext)
    if (!store) throw new Error('Store not found')

    return store.set
  }

  const contextWrapper = <SelfComponentProps, PublicContextProps extends Partial<Store>> (
    Module: ComponentType<SelfComponentProps & { contextProps?: PublicContextProps }>,
  ) => function ({ contextProps, ...props }: SelfComponentProps & { contextProps?: PublicContextProps }) {
      return (
        <ContextProvider initialState={contextProps}>
          <Module {...props as PropsWithChildren<SelfComponentProps>} />
        </ContextProvider>
      )
    }

  return {
    useStoreSelector: useStoreSelectorReact18,
    useStoreDispatch,
    contextWrapper,
  }
}
