import { UserInfo } from '@api/users/types/user.type'
import { Button } from '@ui/common/Button'
import { Image } from '@ui/common/Image'
import { Popover } from '@ui/common/Popover'
import { Text } from '@ui/common/Text'
import { cn } from '../cn'

interface ContactsListProps {
  contacts?: UserInfo[]
  renderContacts: (contacts: UserInfo[]) => React.ReactNode
  onClickUser?: (id: string) => void
}

export function ContactsList(props: ContactsListProps) {
  const { contacts = [], renderContacts, onClickUser } = props
  const [visible, other] = (contacts || []).reduce((acc, el, index) => {
    if (index < 3) {
      acc[0].push(el)
    } else {
      acc[1].push(el)
    }

    return acc
  }, [[], []] as [UserInfo[], UserInfo[]])

  return (
    <div className={cn('ContactsList')}>
      <Popover
        content={(
          <div className={cn('ContactsListOther')}>
            {
                other?.map(({ name, id, profileImage }) => (
                  <Button
                    className={cn('ContactsListOtherButton')}
                    key={id}
                    onClick={() => onClickUser?.(id)}
                  >
                    <div className={cn('ContactsListOtherImgBox')}>
                      <Image alt="bunner" src={profileImage} width={30} height={30} />
                    </div>
                    <Text fs="12">{name}</Text>
                  </Button>
                ))
              }
          </div>
          )}
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
