'use client'

import { CommentDTO } from '../../../types/commentDTO'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { AddComment, ButtonSubmit, CommentsList } from './elements'

interface CommentsProps {
  className?: string;
  module?: 'post' | 'video' | 'music'
  id?: string
  onClose: VoidFunction
  comments?: CommentDTO[]
}

export function Comments(props: CommentsProps) {
  const { className, id, module, onClose, comments } = props
  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('InputContainer')}>
        <AddComment />
        <ButtonSubmit onClose={onClose} onSubmit={(text) => console.log('Коммент добавлен', id, module, text)} />
      </div>
      <CommentsList comments={comments} />
    </div>
  )
}
