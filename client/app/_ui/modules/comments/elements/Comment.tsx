import { useBooleanState } from '@hooks'
import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { CommentWithChildCountDto } from '../../../../../../swagger/comments/interfaces-comments'
import { commentsApi } from '../../../../../store/api'
import { cn } from '../cn'

export interface CommentProps {
  target: 'post' | 'media'
  id: string
  comment: CommentWithChildCountDto
  onAnswerEntity?: (comment: CommentWithChildCountDto) => void
}

export function Comment(props: CommentProps) {
  const { comment, onAnswerEntity, id, target } = props
  const { text, date_created, author, child_count } = comment
  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)
  const [onRemoveComment] = commentsApi.useRemoveMutation()
  const [onUpdateComment] = commentsApi.useUpdateMutation()

  return (
    <>
      <Publication
        authorPosition="left"
        className={cn('Comment')}
        contextProps={{ id: comment.id }}
      >
        <Publication.ChangeContainer
          onAnswerEntity={(publicationId) => {
            onAnswerEntity?.(comment)
          }}
          onSubmit={(result) => {
            console.log('result', result)
            onUpdateComment({
              id: result.id,
              body: {
                text: result.text,
              },
            })
            // handleUpdateMsg({ id, ...result, dateChanged: new Date() })
          }}
          onRemove={(id) => {
            onRemoveComment({ id })
          }}
        />
        <Publication.Text text={text} />
        {author && (
        <Publication.Author authorComponent={<Image src={author.profile_image} height={40} width={40} alt={author.name} />} />
        )}
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.Commets countComments={child_count} onClick={isOpenComments ? onCloseComments : onOpenComments} />
        <Publication.DateCreated dateCreated={new Date(date_created)} />
      </Publication>
      {isOpenComments && (
        <ModuleComments
          target={target}
          id={id}
          parentCommentId={comment.id}
          onClose={onCloseComments}
        />
      )}
    </>
  )
}
