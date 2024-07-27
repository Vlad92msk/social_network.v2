import { UserInfo } from '@api/users/types/user.type'
import { Image } from '@ui/common/Image'
import { ContactsList } from './ContactsList'
import { cn } from '../cn'

interface BannerProps {
  contacts?: UserInfo[]
}

export function Banner(props: BannerProps) {
  const { contacts } = props
  return (
    <div className={cn('Banner')}>
      <div className={cn('BannerBck')}>
        <Image alt="bunner" src="base/bunner" width={400} height={200} />
      </div>
      <div className={cn('MyPhoto')}>
        <Image alt="bunner" src="base/me" width={70} height={70} />
      </div>
      <ContactsList
        contacts={contacts}
        renderContacts={(visible) => (
          visible.map(({ id, name, profileImage }, index) => (
            <div
              key={id}
              className={cn('ContactItemBox')}
              style={{
                zIndex: 3 - (index + 1),
                transform: `translateX(${10 * (3 - (index + 1))}px)`,
              }}
            >
              <Image src={profileImage} width={40} height={40} alt={name || id} />
            </div>
          ))
        )}
      />
    </div>
  )
}
