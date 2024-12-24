'use client'

import { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { classNames, makeCn } from '@utils/others'
import style from './Messenger.module.scss'
import { useKeyboardEvents, useSocketConnect } from '../hooks'
import { MessengerSelectors } from '../store/selectors'

export const cn = makeCn('Messenger', style)

interface MessengerProps {
  className?: string;
}

export function Messenger(props: PropsWithChildren<MessengerProps>) {
  const { className, children } = props
  const isConnected = useSelector(MessengerSelectors.selectIsConnected)

  useSocketConnect()
  useKeyboardEvents()

  if (!isConnected) return <div>Connecting...</div>
  return (
    <div className={classNames(cn(), className)}>
      {children}
    </div>
  )
}
