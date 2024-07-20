import { Message as UserMessage } from '@api/messenger/dialogs/types/message.type'
import { useProfile } from '@hooks'
import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { cn } from './cn'

interface MessageProps {
  message: UserMessage & {forwardMsg?: UserMessage}
}

export function Message(props: MessageProps) {
  const { message } = props
  const {
    id, author, text, media, dateRead, dateCreated, dateDeliver, dateChanged, forwardMessageId, forwardMsg
  } = message
  const { profile } = useProfile()


  const from = profile?.userInfo.id === author?.id ? 'me' : 'other'
  return (
    <div
      id={`dialog-message-${id}`}
      className={cn('Message', { from })}
    >
      <Publication
        contextProps={{ dateChanged }}
        className={cn('MessageItem')}
        authorPosition={from === 'me' ? 'right' : 'left'}
      >
        <Publication.ChangeContainer
          onSubmit={(result) => console.log('result', result)}
          onRemove={() => console.log('remove', id)}
        />
        {/* <Publication.MediaContainer */}
        {/*   text={publication.media?.text} */}
        {/*   audio={publication.media?.audio} */}
        {/*   video={publication.media?.video} */}
        {/*   image={publication.media?.image} */}
        {/*   other={publication.media?.other} */}
        {/* /> */}
        <Publication.Response quoteMessageId={forwardMessageId} text={forwardMsg?.text} name={forwardMsg?.author?.name} />
        <Publication.Text className={cn('MessageItemText')} text={text} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.Author authorComponent={<Image src={author?.profileImage} height={40} width={40} alt={author?.name || ''} />} />
        <Publication.DateCreated dateCreated={dateCreated} />
        <Publication.DateRead dateDeliver={dateDeliver} dateRead={dateRead} />
      </Publication>
    </div>
  )
}
