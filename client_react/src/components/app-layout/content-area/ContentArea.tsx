import { makeCn } from '@utils'

import style from './ContentArea.module.scss'

const cn = makeCn('ContentArea', style)

export interface ContentAreaProps {
  children: React.ReactNode
}

export function ContentArea(props: ContentAreaProps) {
  const { children } = props

  return <div className={cn()}>{children}</div>
}
