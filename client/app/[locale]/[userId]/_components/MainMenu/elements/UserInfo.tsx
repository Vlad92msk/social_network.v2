import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { BaseSpinner } from '@ui/base/BaseSpinner'
import { CommonText } from '@ui/common/CommonText/CommonText'
import { cn } from '../cn'

export function UserInfo() {
  const { data, status } = useSession()

  return (
    <div className={cn('UserInfo')}>
      {
        status === 'loading' ? <BaseSpinner /> : status === 'authenticated' ? (
          <>
            {data?.user?.image && (
            <div className={cn('UserAvatarContainer')}>
              <Image src={data.user.image} alt="me" width={50} height={50} />
            </div>
            )}
            <CommonText className={cn('UserName')} fs="12">
              {data?.user?.name}
            </CommonText>
          </>
        ) : undefined
      }
    </div>
  )
}
