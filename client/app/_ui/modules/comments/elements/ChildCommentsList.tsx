import { classNames } from '@utils/others'
import React from 'react'
import { ChildComment } from './ChildComment'
import { commentsApi } from '../../../../../store/api'
import { cn } from '../cn'

interface ChildCommentsListProps {
  id: string
  parentCommentId: string
}

export const ChildCommentsList = React.memo((props:ChildCommentsListProps) => {
  const { id, parentCommentId } = props
  const { data: comments } = commentsApi.useFindChildCommentsQuery({ parent_id: parentCommentId })

  if (!comments) return null
  return (
    <div className={classNames(cn('CommentsList'))}>
      {comments?.map((comment) => (
        <ChildComment
          key={comment.id}
          id={id}
          comment={comment}
        />
      ))}
    </div>
  )
})
