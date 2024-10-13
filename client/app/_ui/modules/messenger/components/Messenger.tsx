'use client'

import { PropsWithChildren, useEffect } from 'react'
import { useDispatch } from 'react-redux'
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
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch({ type: 'WEBSOCKET_CONNECT' })

    return () => {
      dispatch({ type: 'WEBSOCKET_DISCONNECT' })
    }
  }, [dispatch])

  return (
    <MessageProvider {...rest}>
      <div className={classNames(cn(), className)}>
        {children}
      </div>
    </MessageProvider>
  )
}
