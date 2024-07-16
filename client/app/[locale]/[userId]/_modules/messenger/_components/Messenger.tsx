import { PropsWithChildren } from 'react'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { MessageProvider } from '../_providers/message/message.provider'
import { MessengerState } from '../_providers/message/message.store'

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
