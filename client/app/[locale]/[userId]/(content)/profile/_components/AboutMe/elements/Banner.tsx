import { BannerImage } from './BannerImage'
import { ProfileImage } from './ProfileImage'
import { UserInfo } from '../../../../../../../../../swagger/userInfo/interfaces-userInfo'
import { cn } from '../cn'

interface BannerProps {
  contacts?: UserInfo[]
  onClickUser?: (id: string) => void
  bunner_image?: string
  image?: string
}

export function Banner(props: BannerProps) {
  const { contacts, onClickUser, image, bunner_image } = props

  return (
    <div className={cn('Banner')}>
      <BannerImage bunner_image={bunner_image} />
      <ProfileImage image={image} />

      {/* <ContactsList */}
      {/*   contacts={contacts} */}
      {/*   onClickUser={onClickUser} */}
      {/*   renderContacts={(visible) => ( */}
      {/*     visible.map(({ id, name, profileImage }, index) => ( */}
      {/*       <Button */}
      {/*         key={id} */}
      {/*         className={cn('ContactItemBox')} */}
      {/*         onClick={() => onClickUser?.(id)} */}
      {/*         style={{ */}
      {/*           zIndex: 3 - (index + 1), */}
      {/*           transform: `translateX(${10 * (3 - (index + 1))}px)`, */}
      {/*         }} */}
      {/*       > */}
      {/*         <Image src={profileImage} width={40} height={40} alt={name || id} /> */}
      {/*       </Button> */}
      {/*     )) */}
      {/*   )} */}
      {/* /> */}
    </div>
  )
}
