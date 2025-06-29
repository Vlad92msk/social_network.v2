import React from 'react'

import { cn } from '../cn'
import { BannerImage } from './BannerImage'
import { ProfileImage } from './ProfileImage'

interface BannerProps {
  onClickUser?: (id: string) => void
}

export const Banner = React.memo((props: BannerProps) => {
  const { onClickUser } = props
  console.log('Banner')

  return (
    <div className={cn('Banner')}>
      <BannerImage />
      <ProfileImage />

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
})
