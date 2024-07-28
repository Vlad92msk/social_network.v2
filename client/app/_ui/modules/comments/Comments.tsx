'use client'

import { AddComment, ButtonSubmit, CommentsList } from './elements'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface CommentsProps {
  className?: string;
  module?: 'post' | 'video' | 'music'
  id?: string
  onClose: VoidFunction

}

export function Comments(props: CommentsProps) {
  const { className, id, module, onClose } = props
  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('InputContainer')}>
        <AddComment />
        <ButtonSubmit onClose={onClose} onSubmit={(text) => console.log('Коммент добавлен', id, module, text)} />
      </div>
      <CommentsList />
    </div>
  )
}
