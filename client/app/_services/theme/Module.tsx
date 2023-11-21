'use client'

import React, { PropsWithChildren, useLayoutEffect } from 'react'
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


export const ThemeService = contextWrapper<PropsWithChildren, ThemeServiceContext>((props) => {
  const { children } = props
  const theme = useThemeServiceSelect((contextStore) => contextStore.theme)

  useLayoutEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return children
})
