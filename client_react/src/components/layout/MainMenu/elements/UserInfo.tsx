import { coreSynapseIDB } from '@store/synapses/core/core.synapse.ts'
import { Dispatch, SetStateAction } from 'react'
import { useSelector } from 'synapse-storage'
import { useAuth } from '../../../../auth'
import { Button } from '../../../ui/common/Button'
import { Image } from '../../../ui/common/Image'
import { Spinner } from '../../../ui/common/Spinner'
import { Text } from '../../../ui/common/Text'
import { cn } from '../cn'

const { selectors } = coreSynapseIDB

interface UserInfoProps {
  setStatus: Dispatch<SetStateAction<'open' | 'close'>>
}

export function UserInfo(props: UserInfoProps) {
  const { setStatus } = props
  const { user, isAuthenticated, isLoading } = useAuth()
  const profile = useSelector(selectors.currentUserProfile)

  const userImg = profile?.user_info.profile_image || user?.avatar
  const userName = profile?.user_info.name || user?.name

  return (
    <div className={cn('UserInfo')}>
      {
        isLoading ? <Spinner /> : isAuthenticated ? (
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
