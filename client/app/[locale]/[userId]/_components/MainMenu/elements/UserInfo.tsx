import { useProfile } from '@hooks'
import { ImageCommon } from '@ui/common/ImageCommon'
import { TextCommon } from '@ui/common/TextCommon/TextCommon'
import { SpinnerBase } from 'app/_ui/base/SpinnerBase'
import { cn } from '../cn'

export function UserInfo() {
  const { session, profile } = useProfile()

  const userImg = profile?.userInfo.profileImage || session.data?.user?.image
  const userName = profile?.userInfo.name || session.data?.user?.name

  return (
    <div className={cn('UserInfo')}>
      {
        session.status === 'loading' ? <SpinnerBase /> : session.status === 'authenticated' ? (
          <>
            {userImg && (
            <div className={cn('UserAvatarContainer')}>
              <ImageCommon src={userImg} alt="me" width={50} height={50} />
            </div>
            )}
            <TextCommon className={cn('UserName')} fs="12">
              {userName}
            </TextCommon>
          </>
        ) : undefined
      }
    </div>
  )
}
