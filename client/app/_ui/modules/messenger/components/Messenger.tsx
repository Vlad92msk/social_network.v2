import { PropsWithChildren } from 'react'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { MessageProvider } from '../store'
import { MessengerState } from '../store/message.store'

export const cn = makeCn('Messenger', style)

interface MessengerProps extends Partial<MessengerState>, PropsWithChildren {
  className?: string;
}

export function Messenger(props: MessengerProps) {
  const { className, children, ...rest } = props

  return (
    <MessageProvider {...rest}>
      <div className={classNames(cn(), className)}>
        {children}
      </div>
    </MessageProvider>
  )
}
