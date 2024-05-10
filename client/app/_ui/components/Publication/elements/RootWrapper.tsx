import { PropsWithChildren } from 'react'
import { classNames } from '@utils/others'
import { cn } from '../cn'

interface RootWrapperProps {
  className?: string
  publicationType: 'comment' | 'post' | 'message'
}

export function RootWrapper(props: PropsWithChildren<RootWrapperProps>) {
  const { className, publicationType, children } = props

  return (
    <div className={classNames(cn('RootWrapper', { type: publicationType }), className)}>
      {children}
    </div>
  )
}
