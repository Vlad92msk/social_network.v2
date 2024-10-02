import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { CommentEntity } from '../../../../../../swagger/comments/interfaces-comments'
import { commentsApi } from '../../../../../store/api'
import { cn } from '../cn'

export interface ChildCommentProps {
  id: string
  comment: CommentEntity
}

export function ChildComment(props: ChildCommentProps) {
  const { comment } = props
  const { text, date_created, author, date_updated } = comment
  const [onRemoveComment] = commentsApi.useRemoveMutation()
  const [onUpdateComment] = commentsApi.useUpdateMutation()
console.log('comment', comment)
  return (
    <Publication
      authorPosition="left"
      className={cn('Comment', { type: 'child' })}
      contextProps={{ id: comment.id, dateChanged: date_updated }}
    >
      <Publication.ChangeContainer
        onSubmit={(result) => {
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
        <Publication.Author authorComponent={<Image src={author.profile_image} height={40} width={40} alt={author.name} />} />
      )}
      <Publication.Emojies
        //@ts-ignore
        entity_id={comment.id} entity_type="comment" reactions={comment.reaction_info}
      />
      <Publication.DateCreated dateCreated={date_created} />
    </Publication>
  )
}
