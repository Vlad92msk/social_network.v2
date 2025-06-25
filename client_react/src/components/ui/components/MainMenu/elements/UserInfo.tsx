import { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../common/Button'
import { Image } from '../../../common/Image'
import { Spinner } from '../../../common/Spinner'
import { Text } from '../../../common/Text'
import { cn } from '../cn'

interface UserInfoProps {
  setStatus: Dispatch<SetStateAction<'open' | 'close'>>
}

export function UserInfo(props: UserInfoProps) {
  const { setStatus } = props
  // const router = useRouter()
  // const params = useParams()
  // const { profile, session } = useProfile()

  // const userImg = profile?.user_info.profile_image || session.data?.user?.image
  // const userName = profile?.user_info.name || session.data?.user?.name

  return (
    <div
      className={cn('UserInfo')}
      // onClick={() => {
      //   if (params.userId !== profile?.user_info.public_id) {
      //     router.push(`/${params.locale}/${profile?.user_info.public_id}`)
      //   }
      // }}
    >
      {/* { */}
      {/*   session.status === 'loading' ? <Spinner /> : session.status === 'authenticated' ? ( */}
      {/*     <> */}
      {/*       {userImg && ( */}
      {/*       <div className={cn('UserAvatarContainer')}> */}
      {/*         <Image src={userImg} alt="me" width={50} height={50} /> */}
      {/*       </div> */}
      {/*       )} */}
      {/*       <Text className={cn('UserName')} fs="12"> */}
      {/*         {userName} */}
      {/*       </Text> */}
      {/*     </> */}
      {/*   ) : undefined */}
      {/* } */}
      <Button
        className={cn('ToggleMenu')}
        onClick={() => setStatus((prev) => (prev === 'open' ? 'close' : 'open'))}
        size="es"
      />
    </div>
  )
}
