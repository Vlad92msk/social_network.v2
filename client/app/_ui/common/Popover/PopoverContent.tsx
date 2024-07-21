import { PropsWithChildren } from 'react'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface PopoverContentProps extends PropsWithChildren{
  className?: string;
}

export function PopoverContent(props: PopoverContentProps) {
  const { className, children } = props

  return <div className={classNames(cn('Content'), className)}>{children}</div>
}
