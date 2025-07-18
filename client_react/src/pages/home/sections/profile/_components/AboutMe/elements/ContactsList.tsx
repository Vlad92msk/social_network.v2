import { Button, Image, Popover, Text } from '@components/ui'
import { AboutUserStorage } from 'store/synapses/user-about'

import { cn } from '../cn'

type Contact = AboutUserStorage['userInfoInit']

interface ContactsListProps {
  contacts?: Contact[]
  renderContacts: (contacts: Contact[]) => React.ReactNode
  onClickUser?: (id: string) => void
}

export function ContactsList(props: ContactsListProps) {
  const { contacts = [], renderContacts, onClickUser } = props
  const [visible, other] = (contacts || []).reduce(
    (acc, el, index) => {
      if (index < 3) {
        acc[0].push(el)
      } else {
        acc[1].push(el)
      }

      return acc
    },
    [[], []] as [Contact[], Contact[]],
  )

  return (
    <div className={cn('ContactsList')}>
      <Popover
        content={
          <div className={cn('ContactsListOther')}>
            {other?.map(({ name, id, profile_image }) => (
              <Button className={cn('ContactsListOtherButton')} key={id} onClick={() => onClickUser?.(String(id))}>
                <div className={cn('ContactsListOtherImgBox')}>
                  <Image alt="bunner" src={profile_image} width={30} height={30} />
                </div>
                <Text fs="12">{name}</Text>
              </Button>
            ))}
          </div>
        }
        trigger="click"
        strategy="fixed"
        closeOnOutsideClick
        placement="left"
      >
        <Button className={cn('UsersPlus')}>
          <Text fs="10">{`+${other.length}`}</Text>
        </Button>
      </Popover>
      {renderContacts(visible)}
    </div>
  )
}
