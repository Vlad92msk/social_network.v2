import { PropsWithChildren } from 'react'

import { classNames, makeCn } from '@utils/others'
import style from './PageContent.module.scss'

const cn = makeCn('PageContent', style)

interface PageMainContentProps extends PropsWithChildren {
  className?: string
}

export function PageContent(props: PageMainContentProps) {
  const { children, className } = props

  return (
    <div className={classNames(cn(), className)}>{children}</div>
  )
}
