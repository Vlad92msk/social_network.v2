import { ReactNode } from 'react'

interface MessengerProps {
  className?: string;
  communicate: ReactNode
  chat: ReactNode
}

export function Messenger(props: MessengerProps) {
  const { className, communicate, chat } = props

  return (
    <div className={className}>
      {communicate}
      {chat}
    </div>
  )
}
