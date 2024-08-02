import { CommentDTO } from '../../../../types/commentDTO'
import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { cn } from '../cn'


export interface CommentProps {
  comment: CommentDTO
}

export function Comment(props: CommentProps) {
  const { comment } = props
  const { text, authorImg, authorName, dateCreated } = comment

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
      <Publication.Author authorComponent={<Image src={authorImg} height={40} width={40} alt={authorName} />} />
      <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
      <Publication.DateCreated dateCreated={dateCreated} />
    </Publication>
  )
}
