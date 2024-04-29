import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface ContactsProps{
  className?: string;
  status: 'open' | 'close'
}

const CONTACTS = [
  { id: '1', contactImg: 'base/me', name: 'Friend 1', lastContactMessage: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '2', contactImg: 'base/me', name: 'Friend 2', lastContactMessage: 'Friend 3', lastMessage: 'last long message last long message last long message last long message' },
  { id: '3', contactImg: 'base/me', name: 'Friend 3', lastContactMessage: 'Friend 3', lastMessage: 'last long message last long message last long message last long message' },
  { id: '4', contactImg: 'base/me', name: 'Friend 4', lastContactMessage: 'Friend 7', lastMessage: 'last long message last long message last long message last long message' },
  { id: '5', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '6', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '7', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '8', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '9', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '10', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '11', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '12', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '13', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '14', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '15', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '16', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
]

export function Contacts(props: ContactsProps) {
  const { className, status } = props

  return (
    <div className={classNames(cn({ status }), className)}>
      {CONTACTS.map(({ contactImg, lastContactMessage, lastMessage, name, id }) => (
        <div key={id} className={cn('Contact')}>
          <div className={cn('ContactImgContainer')}>
            <ImageCommon src={contactImg} alt={id} width="50" height="50" />
          </div>
          <div className={cn('ContactContentWrapper')}>
            <TextCommon className={cn('ContactName')} fs="12" textElipsis>{name}</TextCommon>
            <TextCommon className={cn('ContactLastContactName')} fs="12" textElipsis>{lastContactMessage}</TextCommon>
            <TextCommon className={cn('ContactLastMessage')} fs="12" textElipsis>{lastMessage}</TextCommon>
          </div>
        </div>
      ))}
    </div>
  )
}
