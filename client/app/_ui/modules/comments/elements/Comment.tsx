import { useBooleanState } from '@hooks'
import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { CommentWithChildCountDto } from '../../../../../../swagger/comments/interfaces-comments'
import { commentsApi } from '../../../../../store/api'
import { cn } from '../cn'

export interface CommentProps {
  target: 'post' | 'media'
  id: string
  comment: CommentWithChildCountDto
}

export function Comment(props: CommentProps) {
  const { comment, id, target } = props
  const { text, date_created, author, child_count, date_updated, is_pinned } = comment
  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)
  const [onRemoveComment] = commentsApi.useRemoveMutation()
  const [onUpdateComment] = commentsApi.useUpdateMutation()
  const [onPinComment] = commentsApi.usePinCommentMutation()

  return (
    <div className={cn('CommentContainer', { pinned: is_pinned })}>
      {is_pinned && (<Text fs="10">Комментарий закреплен</Text>)}
      <Publication
        authorPosition="left"
        className={cn('Comment')}
        contextProps={{ id: comment.id, dateChanged: date_updated }}
      >
        <Publication.ChangeContainer
          onPin={(id) => {
            onPinComment({ comment_id: id })
          }}
          onSubmit={(result) => {
            // console.log('result', result)
            onUpdateComment({
              id: result.id,
              body: {
                text: result.text,
              },
            })
          }}
          onRemove={(id) => {
            onRemoveComment({ id })
          }}
        />
        <Publication.Text text={text} />
        {author && (
          <Publication.Author
            authorComponent={
              <Image src={author.profile_image} height={40} width={40} alt={author.name} />
            }
          />
        )}
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.Commets isActive={isOpenComments} countComments={child_count} onClick={isOpenComments ? onCloseComments : onOpenComments} />
        <Publication.DateCreated dateCreated={date_created} />
      </Publication>
      {isOpenComments && (
        <ModuleComments
          target={target}
          id={id}
          parentCommentId={comment.id}
          onClose={onCloseComments}
        />
      )}
    </div>
  )
}
