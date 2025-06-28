import React, { useCallback, useMemo } from 'react'
import { classNames } from '@utils'
import { isString } from 'lodash'

import { Button } from '../Button'
import { Icon, IconName } from '../icon'
import { Text, TextSizes } from '../Text'
import { cn } from './cn'
import { TabSizes, useTabsSelect, useTabsUpdate } from './Tabs'

const sizes: Record<TabSizes, Partial<TextSizes>> = {
  medium: '14',
  small: '10',
  large: '18',
}

export interface LmTabProps {
  className?: string
  value: string | number
  onClick?: VoidFunction
  title: string | number | React.ReactNode
  icon?: IconName
  ref?: React.Ref<HTMLDivElement>
}

export function TabOption(props: LmTabProps) {
  const { className, value, onClick, title, icon, ref } = props
  const updateContext = useTabsUpdate()

  const activeTab = useTabsSelect((ctx) => ctx.activeTab)
  const color = useTabsSelect((ctx) => ctx.tabsColor)
  const type = useTabsSelect((ctx) => ctx.tabsType)
  const size = useTabsSelect((ctx) => ctx.tabsSize) || 'large'

  const tabIsActive = useMemo(() => activeTab === value, [activeTab, value])

  const content = useMemo(() => {
    if (isString(title)) {
      return (
        <>
          {icon && <Icon name={icon} />}
          <Text fs={type === 'Button' ? sizes[size] : '14'} className={cn('Tab', { active: tabIsActive })}>
            {title}
          </Text>
        </>
      )
    }

    return title
  }, [icon, size, title, type, tabIsActive])

  const handleChangeActive = useCallback(() => {
    /* Если пользователь множество раз нажимает на один и тот же таб - ничего не перерисовывалось */
    if (activeTab !== value) {
      updateContext((ctx) => ({
        ...ctx,
        activeTab: value,
      }))
      onClick?.()
    }
  }, [activeTab, onClick, updateContext, value])

  return (
    <Button
      ref={ref}
      key={value}
      // variant={type === 'Button' ? (tabIsActive ? 'primary' : 'secondary') : 'secondary'}
      // className={classNames(cn(`Tab${type}`, { color, size, active: tabIsActive }), className)}
      className={classNames(cn(`TabButton`, { color, size, active: tabIsActive }), className)}
      onClick={handleChangeActive}
    >
      {content}
    </Button>
  )
}
