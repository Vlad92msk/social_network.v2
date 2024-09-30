import { classNames } from '@utils/others'
import { commentsApi } from '../../../../../store/api'
import { Comment } from './Comment'
import { cn } from '../cn'

interface CommentsListProps {
  target: 'post' | 'media' | 'photo'
  id: string
}

export function CommentsList(props:CommentsListProps) {
  const { id, target } = props
  const { data: comments } = commentsApi.useFindCommentsQuery({ target, entity_id: id })

  if (!comments?.data) return null
  return (
    <div className={classNames(cn('CommentsList'))}>
      {comments.data?.map((comment) => (
        <Comment
          key={comment.id}
          target={target}
          id={id}
          comment={comment}
        />
      ))}
    </div>
  )
}
