'use client'

import { AddComment, ButtonSubmit, CommentsList } from './elements'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface CommentsProps {
  className?: string;
}

export function Comments(props: CommentsProps) {
  const { className } = props
  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('InputContainer')}>
        <AddComment />
        <ButtonSubmit />
      </div>
      <CommentsList />
    </div>
  )
}
