import { useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text/Text'
import { Image } from 'app/_ui/common/Image'
import { cn } from '../cn'

export function UserInfo() {
  const { session, profile } = useProfile()

  const userImg = profile?.userInfo.profileImage || session.data?.user?.image
  const userName = profile?.userInfo.name || session.data?.user?.name

  return (
    <div className={cn('UserInfo')}>
      {
        session.status === 'loading' ? <Spinner /> : session.status === 'authenticated' ? (
          <>
            {userImg && (
            <div className={cn('UserAvatarContainer')}>
              <Image src={userImg} alt="me" width={50} height={50} />
            </div>
            )}
            <Text className={cn('UserName')} fs="12">
              {userName}
            </Text>
          </>
        ) : undefined
      }
    </div>
  )
}
