'use client'

import { PropsWithChildren, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { MessageProvider } from '../store'
import { MessengerState } from '../store/message.ctx'

export const cn = makeCn('Messenger', style)

interface MessengerProps extends Partial<MessengerState>, PropsWithChildren {
  className?: string;
}

export function Messenger(props: MessengerProps) {
  const { className, children, ...rest } = props
  const dispatch = useDispatch()
  const isConnected = useSelector(MessengerSelectors.selectIsConnected)

  useEffect(() => {
    dispatch({ type: 'WEBSOCKET_CONNECT' })

    return () => {
      dispatch({ type: 'WEBSOCKET_DISCONNECT' })
    }
  }, [dispatch])

  if (!isConnected) return <div>Connecting...</div>
  return (
    <MessageProvider {...rest}>
      <div className={classNames(cn(), className)}>
        {children}
      </div>
    </MessageProvider>
  )
}
