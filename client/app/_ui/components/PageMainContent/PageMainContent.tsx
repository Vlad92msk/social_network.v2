import { PropsWithChildren } from 'react'

import { classNames, makeCn } from '@utils/others'
import style from './PageMainContent.module.scss'

const cn = makeCn('PageMainContent', style)

interface PageMainContentProps extends PropsWithChildren{
className?: string
}

export function PageMainContent(props: PageMainContentProps) {
  const { children, className } = props

  return (
    <div className={classNames(cn(), className)}>{children}</div>
  )
}
