import { subMinutes } from 'date-fns'
import { Message as UserMessage } from '@api/messenger/dialogs/types/message.type'
import { useProfile } from '@hooks'
import { Image } from '@ui/common/Image'
import { Publication } from '@ui/components/Publication'
import { cn } from './cn'
import { useMessageStore } from '../../../../store'

interface MessageProps {
  message: UserMessage & {forwardMsg?: UserMessage}
}

export function Message(props: MessageProps) {
  const { message } = props
  const {
    id, author, text, dateRead, dateCreated, dateDeliver, dateChanged, forwardMessageId, forwardMsg,
  } = message
  const { profile } = useProfile()
  const handleRemoveMsg = useMessageStore((store) => store.onRemoveMessage)
  const handleUpdateMsg = useMessageStore((store) => store.onUpdateMessage)

  const from = profile?.userInfo.id === author?.id ? 'me' : 'other'
  return (
    <div
      id={`dialog-message-${id}`}
      className={cn('Message', { from })}
    >
      <Publication
        contextProps={{ dateChanged, id }}
        className={cn('MessageItem')}
        authorPosition={from === 'me' ? 'right' : 'left'}
        dateRead={dateRead}
        onRead={(publicationId) => {
          const newDate = subMinutes(new Date(), 1)
          console.log('read', publicationId, newDate)
          handleUpdateMsg({ id: publicationId, dateRead: newDate, dateDeliver: newDate })
        }}
      >
        <Publication.ChangeContainer
          onSubmit={(result) => {
            console.log('result', result)
            handleUpdateMsg({ id, ...result, dateChanged: new Date() })
          }}
          onRemove={handleRemoveMsg}
        />
        <Publication.MediaContainer
          text={message.media?.text}
          audio={[...(message.media?.audio || []), ...(message.voices || []).map((item) => ({ ...item, src: item.url }))]}
          video={[...(message.media?.video || []), ...(message.videos || []).map((item) => ({ ...item, src: item.url }))]}
          image={message.media?.image}
          other={message.media?.other}
        />
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
