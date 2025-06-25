import { classNames } from '@utils'
import React, { PropsWithChildren } from 'react'
import { cn } from './cn'

export interface LmTabsListProps extends PropsWithChildren {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  ref?: React.Ref<any>;
}

export function TabsList(props: LmTabsListProps) {
  const { className, orientation = 'horizontal', children, ref } = props

  return (
    <div className={classNames(cn('TabsList', { orientation }), className)} ref={ref}>
      {children}
    </div>
  )
}
