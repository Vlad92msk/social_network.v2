import { CommentDTO } from '../../../../types/commentDTO'
import { classNames } from '@utils/others'
import { Comment } from './Comment'
import { cn } from '../cn'

interface CommentsListProps {
    comments?: CommentDTO[]
}

export function CommentsList(props:CommentsListProps) {
  const { comments } = props
  return (
    <div className={classNames(cn('CommentsList'))}>
      {comments?.map((comment) => (
        <Comment key={comment.dateCreated.toString()} comment={comment} />
      ))}
    </div>
  )
}
