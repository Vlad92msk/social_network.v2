import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { availableImages } from '@hooks'
import { TextCommon } from '@ui/common/TextCommon'
import { cn } from './cn'
import { FILE_FORMAT_IMAGE } from '../../../../../../../types/fileFormats'
import { MessagePropsResponse } from '../../../../_providers/dialogSelected'

interface MessageProps {
  message: MessagePropsResponse
}

export function Message(props: MessageProps) {
  const { message } = props
  const {
    id, messege: { text, forwardMessageId, media }, date, emojis, isFromMe, isRead, isDelivered,
  } = message

  return (
    <div
      id={id}
      className={cn('Message', { from: isFromMe ? 'me' : 'other' })}
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
          <TextCommon className={cn('MessageText')} fs="14">{text}</TextCommon>
        </div>
      </div>
      <div className={cn('MessageFooter')}>
        <div className={cn('MessageEmojies')}>
          {emojis?.map(() => <span key="1">emoji</span>)}
        </div>
        <div className={cn('MessageMetaInfo')}>
          <TextCommon className={cn('MessageMetaInfoDate')} fs="8">
            {date && format(date, 'HH:mm', { locale: ru })}
          </TextCommon>
          <div className={cn('MessageMetaInfoDeliver')}>
            {isDelivered && (<span>Доставлено</span>)}
            {isRead && (<span>прочитано</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
