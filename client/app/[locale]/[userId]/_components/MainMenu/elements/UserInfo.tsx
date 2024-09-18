import { useProfile } from '@hooks'
import { Button } from '@ui/common/Button'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text/Text'
import { Image } from 'app/_ui/common/Image'
import { Dispatch, SetStateAction } from 'react'
import { cn } from '../cn'

interface UserInfoProps {
  setStatus: Dispatch<SetStateAction<'open' | 'close'>>
}

export function UserInfo(props: UserInfoProps) {
  const { setStatus } = props
  const { profile, session } = useProfile()

  const userImg = profile?.user_info.profile_image || session.data?.user?.image
  const userName = profile?.user_info.name || session.data?.user?.name

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
      <Button
        className={cn('ToggleMenu')}
        onClick={() => setStatus((prev) => (prev === 'open' ? 'close' : 'open'))}
        size="es"
      />
    </div>
  )
}
