import { createStoreContext } from '@utils'
import { PropsWithChildren } from 'react'
import { cn } from './cn'

/**
 * То что можно передать в контекст Компонента
 */
interface PublicationContextState {
  activeId?: string
}

const initialState: PublicationContextState = {
  activeId: undefined,
}

export const {
  contextWrapper,
  useStoreSelector: useTabCtxSelect,
  useStoreDispatch: useTabCtxUpdate,
} = createStoreContext({
  initialState,
})

export const Tab = contextWrapper<PropsWithChildren, PublicationContextState>((props) => {
  const { children } = props
  return (
    <div className={cn()}>{children}</div>
  )
})
