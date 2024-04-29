import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { useMessengerContacts } from '../../../../store/contacts'

interface ContactsProps{
  className?: string;
  status: 'open' | 'close'
}

export function Contacts(props: ContactsProps) {
  const { className, status } = props
  const filteredContacts = useMessengerContacts((state) => state.filteredContacts())

  return (
    <div className={classNames(cn({ status }), className)}>
      {filteredContacts.map(({
        contactImg,
        lastContactMessage,
        lastMessage,
        name,
        id,
      }) => (
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
