import { ComponentType, createContext, PropsWithChildren, useContext } from 'react'
import { create, StoreApi, useStore } from 'zustand'

export function createZustandContext<Store>(initialState: Store) {
  const StoreContext = createContext<StoreApi<Store> | null>(null)

  const useZustandStore = <T, >(selector: (store: Store) => T): T => {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error('Zustand store not found')
    }
    return useStore(store, selector)
  }

  const useZustandDispatch = () => {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error('Zustand store not found')
    }
    return store.setState
  }

  const contextZustand = <SelfComponentProps, PublicContextProps extends Partial<Store>>(
    Component: ComponentType<SelfComponentProps & { contextProps?: PublicContextProps }>,
  ) => {
    function WrappedComponent({ contextProps, ...props }: SelfComponentProps & { contextProps?: PublicContextProps }) {
      const store = create<Store>()((set) => ({
        ...initialState,
        ...contextProps,
        setState: set,
      }))

      return (
        <StoreContext.Provider value={store}>
          <Component {...(props as PropsWithChildren<SelfComponentProps>)} />
        </StoreContext.Provider>
      )
    }

    return WrappedComponent
  }

  return {
    contextZustand,
    useZustandSelector: useZustandStore,
    useZustandDispatch,
  }
}
