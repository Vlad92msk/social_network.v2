'use client'

import { classNames } from '@utils/others'
import { cn } from './cn'
import { ChildCommentsList, CommentsList, InputContainer } from './elements'
import { commentsApi } from '../../../../store/api'

export interface CommentsProps {
  className?: string;
  target: 'post' | 'media'
  id: string
  parentCommentId?: string
  onClose?: VoidFunction
}

export function ModuleComments(props: CommentsProps) {
  const { className, id, target, onClose, parentCommentId } = props
  const [onAddComment] = commentsApi.useCreateMutation()

  return (
    <div className={classNames(cn({ type: Boolean(parentCommentId) && 'child' }), className)}>
      <InputContainer
        onClose={onClose}
        onSubmit={(text) => {
          // console.log('Коммент добавлен', id, target, text)
          onAddComment({
            target,
            entity_id: id,
            body: {
              text,
              parent_comment_id: parentCommentId,
            },
          })
        }}
      />
      {parentCommentId ? (
        <ChildCommentsList
          parentCommentId={parentCommentId}
          id={id}
        />
      ) : (
        <CommentsList
          id={id}
          target={target}
        />
      )}
    </div>
  )
}
