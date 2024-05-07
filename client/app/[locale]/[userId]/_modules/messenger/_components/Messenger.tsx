import { ReactNode } from 'react'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { MessengerRootProvider } from '../_providers/root'

export const cn = makeCn('Messenger', style)

interface MessengerProps {
  className?: string;
  communicate: ReactNode
  chat: ReactNode
}

export function Messenger(props: MessengerProps) {
  const { className, communicate, chat } = props

  return (
    <MessengerRootProvider>
      <div className={classNames(cn(), className)}>
        {communicate}
        {chat}
      </div>
    </MessengerRootProvider>
  )
}
