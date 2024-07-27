import { Image } from '@ui/common/Image'
import { cn } from '../cn'
import { Publication } from '@ui/components/Publication'

interface CommentProps {
  text: string
  authorImg: string
  authorName: string
  dateCreated: Date
}

export const Comment = (props: CommentProps) => {
const { text, authorImg, authorName, dateCreated } = props

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
