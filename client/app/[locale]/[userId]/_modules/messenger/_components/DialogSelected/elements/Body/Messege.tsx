import { Icon } from 'app/_ui/common/Icon'
import { format, isPast } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Message as UserMessage } from '@api/messenger/dialogs/types/message.type'
import { availableImages, useProfile } from '@hooks'
// @ts-ignore
import { FILE_FORMAT_IMAGE } from '@types/fileFormats'
import { Text } from 'app/_ui/common/Text'
import { cn } from './cn'

interface MessageProps {
  message: UserMessage
}

export function Message(props: MessageProps) {
  const { message } = props
  const {
    id, emojis, text, forwardMessageId, media, author, dateRead, dateDeliver, dateCreated,
  } = message

  const { profile } = useProfile()

  return (
    <div
      id={id}
      className={cn('Message', { from: profile?.userInfo.id === author?.id ? 'me' : 'other' })}
    >
      <div className={cn('MessageMainContent')}>
        {forwardMessageId && (<div>forward</div>)}
        <div className={cn('MessageContent')}>
          <div className={cn('MessageMedia')}>
            {media?.map(({ type, src, name }) => {
              if (Object.values(availableImages).includes(type as FILE_FORMAT_IMAGE)) {
                return <img key={src} src={src} alt={name} style={{ maxHeight: 'inherit' }} />
              }

              return <span>media</span>
            })}
          </div>
          <Text className={cn('MessageText')} fs="14">{text}</Text>
        </div>
      </div>
      <div className={cn('MessageFooter')}>
        <div className={cn('MessageEmojies')}>
          {emojis?.map(() => <span key="1">emoji</span>)}
        </div>
        <div className={cn('MessageMetaInfo')}>
          <Text className={cn('MessageMetaInfoDate')} fs="8">
            {dateCreated && format(dateCreated, 'HH:mm', { locale: ru })}
          </Text>
          <div className={cn('MessageMetaInfoDeliver')}>
            {
              (dateDeliver && dateRead) && (
                <Icon name={isPast(dateDeliver) ? 'check' : 'checkmark'} className={cn('MessageMetaInfoDeliverIcon', { readable: isPast(dateRead) })} />
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
