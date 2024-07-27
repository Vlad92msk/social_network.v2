'use client'

import { classNames } from '@utils/others'
import { cn } from './cn'

interface CommentsProps {
  className?: string;
}

export function Comments(props: CommentsProps) {
  const { className } = props
  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('Comment')}>1</div>
      <div className={cn('Comment')}>2</div>
      <div className={cn('Comment')}>3</div>
      <div className={cn('Comment')}>4</div>
    </div>
  )
}
