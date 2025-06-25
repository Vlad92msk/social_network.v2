import { classNames } from '@utils'
import { PropsWithChildren } from 'react'
import { cn } from './cn'
import { useTabsSelect } from './Tabs'

export interface LmTabPanelProps extends PropsWithChildren {
  className?: string;
  value: string | number;
}

export function TabPanel(props: LmTabPanelProps) {
  const { className, value, children } = props
  const activeTab = useTabsSelect((ctx) => ctx.activeTab)

  if (activeTab !== value) return null
  return (
    <div key={value} className={classNames(cn('TabPanel'), className)}>
      {children}
    </div>
  )
}
