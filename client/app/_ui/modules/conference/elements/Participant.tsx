import { PropsWithChildren } from 'react'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface LocalPreviewProps {
  className?: string
  onClick?: VoidFunction
}

export function Participant(props: PropsWithChildren<LocalPreviewProps>) {
  const { className, onClick, children } = props

  return (
    <div className={classNames(cn('Participant'), className)} onClick={onClick}>
      {children}
    </div>
  )
}
