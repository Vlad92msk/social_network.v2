import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { SpinnerBase } from 'app/_ui/base/SpinnerBase'
import { TextCommon } from '@ui/common/TextCommon/TextCommon'
import { cn } from '../cn'

export function UserInfo() {
  const { data, status } = useSession()

  return (
    <div className={cn('UserInfo')}>
      {
        status === 'loading' ? <SpinnerBase /> : status === 'authenticated' ? (
          <>
            {data?.user?.image && (
            <div className={cn('UserAvatarContainer')}>
              <Image src={data.user.image} alt="me" width={50} height={50} />
            </div>
            )}
            <TextCommon className={cn('UserName')} fs="12">
              {data?.user?.name}
            </TextCommon>
          </>
        ) : undefined
      }
    </div>
  )
}
