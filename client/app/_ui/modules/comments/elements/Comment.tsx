import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { CommentWithChildCountDto } from '../../../../../../swagger/comments/interfaces-comments'
import { cn } from '../cn'

export interface CommentProps {
  comment: CommentWithChildCountDto
}

export function Comment(props: CommentProps) {
  const { comment } = props
  const { text, date_created, author } = comment

  // console.log('comment', comment)

  return (
    <Publication
      authorPosition="left"
      className={cn('Comment')}
    >
      <Publication.ChangeContainer
        onSubmit={(result) => {
          console.log('result', result)
          // handleUpdateMsg({ id, ...result, dateChanged: new Date() })
        }}
        onRemove={(result) => {
          console.log('result', result)
        }}
      />
      <Publication.Text text={text} />
      <Publication.Author authorComponent={author && <Image src={author.profile_image} height={40} width={40} alt={author.name} />} />
      <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
      <Publication.DateCreated dateCreated={new Date(date_created)} />
    </Publication>
  )
}
