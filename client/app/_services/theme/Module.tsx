'use client'

import { PropsWithChildren } from 'react'
import { createStoreContext } from '@shared/utils/createStoreContext'
import { initialState, ThemeServiceContext } from './context/initialState'

export const {
  contextWrapper,
  useStoreSelector: useThemeServiceSelect,
  useStoreDispatch: useThemeServiceUpdate,
} = createStoreContext({
  // name: 'Theme',
  initialState,
})

export const ThemeService = contextWrapper<PropsWithChildren, ThemeServiceContext>(({ children }) => children)
