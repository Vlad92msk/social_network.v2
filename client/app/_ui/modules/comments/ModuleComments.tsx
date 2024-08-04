'use client'

import { useState } from 'react'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { AddComment, ButtonSubmit, CommentsList } from './elements'
import { CommentDTO } from '../../../types/commentDTO'

interface CommentsProps {
  className?: string;
  module?: 'post' | 'video' | 'music' | 'photo'
  id?: string
  onClose?: VoidFunction
  commentsIds?: string[]
}

export function ModuleComments(props: CommentsProps) {
  const { className, id, module, onClose, commentsIds } = props

  /**
   * Потом будем по переданным ID запрашивать комментарии
   */
  const [localComments, setLocalComments] = useState<CommentDTO[]>([
    { id: '1', text: 'comment 1', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '2', text: 'comment 2', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '3', text: 'comment 3', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '4', text: 'comment 4', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '5', text: 'comment 5', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '6', text: 'comment 6', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
    { id: '7', text: 'comment 7', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
  ])

  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('InputContainer')}>
        <AddComment />
        <ButtonSubmit onClose={onClose} onSubmit={(text) => console.log('Коммент добавлен', id, module, text)} />
      </div>
      <CommentsList comments={localComments} />
    </div>
  )
}
