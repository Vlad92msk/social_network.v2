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
  const { text, date_created, author } = comment
  const [onRemoveComment] = commentsApi.useRemoveMutation()
  const [onUpdateComment] = commentsApi.useUpdateMutation()

  return (
    <Publication
      authorPosition="left"
      className={cn('Comment')}
      contextProps={{ id: comment.id }}
    >
      <Publication.ChangeContainer
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
      <Publication.DateCreated dateCreated={new Date(date_created)} />
    </Publication>
  )
}
