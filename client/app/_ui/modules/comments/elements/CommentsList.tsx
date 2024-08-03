import { CommentDTO } from '../../../../types/commentDTO'
import { classNames } from '@utils/others'
import { Comment } from './Comment'
import { cn } from '../cn'

interface CommentsListProps {
    comments?: CommentDTO[]
}

export function CommentsList(props:CommentsListProps) {
  const { comments } = props

  if (!comments) return null
  return (
    <div className={classNames(cn('CommentsList'))}>
      {comments?.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  )
}
