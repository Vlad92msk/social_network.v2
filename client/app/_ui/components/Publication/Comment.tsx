import { classNames } from '@utils/others'
import { cn } from './cn'
import { RootWrapper } from './elements'

interface CommentProps {
  className?: string
}

export function Comment(props: CommentProps) {
  const { className } = props
  return (
    <RootWrapper
      className={classNames(cn('Comment'), className)}
      publicationType="comment"
    >
      Comment
    </RootWrapper>
  )
}
