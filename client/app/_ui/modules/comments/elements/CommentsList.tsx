import { Spinner } from '@ui/common/Spinner'
import { classNames } from '@utils/others'
import { commentsApi } from '../../../../../store/api'
import { Comment } from './Comment'
import { cn } from '../cn'

interface CommentsListProps {
  target: 'post' | 'media'
  id: string
}

export function CommentsList(props:CommentsListProps) {
  const { id, target } = props
  const { data: comments, isLoading } = commentsApi.useFindCommentsQuery({ target, entity_id: id })

  return (
    <div className={classNames(cn('CommentsList'))}>
      {isLoading ? <Spinner /> : comments?.data?.map((comment) => (
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
