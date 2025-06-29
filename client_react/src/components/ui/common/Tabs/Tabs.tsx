import React, { CSSProperties, PropsWithChildren, useEffect } from 'react'
import { classNames, createStoreContext } from '@utils'

import { cn } from './cn'

export type TabSizes = 'small' | 'medium' | 'large'

export interface LmTabsContextType {
  activeTab?: string | number
  onWatch?: (activeTab?: string | number) => void
  onChange?: () => string | number
  tabsType?: 'Button' | 'UnderLine'
  tabsColor?: 'accent' | 'white'
  tabsSize?: TabSizes
}

const initialState: LmTabsContextType = {
  activeTab: 1,
  onChange: undefined,
  onWatch: undefined,
  tabsType: 'UnderLine',
  tabsColor: 'accent',
  tabsSize: 'large',
}

export const {
  contextWrapper,
  useStoreSelector: useTabsSelect,
  useStoreDispatch: useTabsUpdate,
} = createStoreContext({
  initialState,
})

export interface LmTabsProps extends PropsWithChildren {
  className?: string
  style?: CSSProperties
  ref?: React.Ref<HTMLDivElement>
}

export const Tabs = contextWrapper<LmTabsProps, LmTabsContextType>((props) => {
  const { className, style, children, ref } = props
  const updateContext = useTabsUpdate()

  /**
   * Отдаем во вне активный таб
   * Вызывая onWatch, если он передан
   */
  useTabsSelect((ctx) => {
    if (ctx.onWatch) {
      const active = ctx.activeTab
      ctx.onWatch(active)
    }
  })

  /**
   * Управляем табами извне
   * Вызывая onChange, если он передан
   */
  useEffect(() => {
    updateContext((ctx) => {
      if (ctx.onChange) {
        return {
          ...ctx,
          activeTab: ctx.onChange(),
        }
      }
      return ctx
    })
  }, [updateContext])

  return (
    <div className={classNames(cn(), className)} style={style} ref={ref}>
      {children}
    </div>
  )
})
