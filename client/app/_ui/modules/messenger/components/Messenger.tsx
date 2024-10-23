'use client'

import { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { useKeyboardEvents, useSocketConnect } from '../hooks'
import { MessageProvider } from '../store'
import { MessengerState } from '../store/message.ctx'
import { MessengerSelectors } from '../store/selectors'

export const cn = makeCn('Messenger', style)

interface MessengerProps extends Partial<MessengerState>, PropsWithChildren {
  className?: string;
}

export function Messenger(props: MessengerProps) {
  const { className, children, ...rest } = props
  const isConnected = useSelector(MessengerSelectors.selectIsConnected)

  useSocketConnect()
  useKeyboardEvents()

  if (!isConnected) return <div>Connecting...</div>
  return (
    <MessageProvider {...rest}>
      <div className={classNames(cn(), className)}>
        {children}
      </div>
    </MessageProvider>
  )
}
