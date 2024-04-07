'use client'

import { PropsWithChildren } from 'react'
import { initialState, ThemeServiceContext } from './context/initialState'
import { createStoreContext } from '../../_utils/client'

export const {
  contextWrapper,
  useStoreSelector: useThemeServiceSelect,
  useStoreDispatch: useThemeServiceUpdate,
} = createStoreContext({
  // name: 'Theme',
  initialState,
})

export const ThemeService = contextWrapper<PropsWithChildren, ThemeServiceContext>(({ children }) => children)
