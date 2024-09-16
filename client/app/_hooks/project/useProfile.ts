import { useSession } from 'next-auth/react'
import { SessionContextValue } from 'next-auth/src/react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { UserProfileInfo } from '../../../../swagger/profile/interfaces-profile'
import { ProfileSelectors } from '../../../store/profile.slice'

interface UserProfile {
  session: SessionContextValue
  profile?: UserProfileInfo
}

export const useProfile = () => {
  const session = useSession()

  const [profile, setProfile] = useState<UserProfile>({ profile: undefined, session })
  const ddd = useSelector(ProfileSelectors.selectProfile)

  console.log('ddd', ddd)

  useEffect(() => {
    const userEmail = session.data?.user?.email

    if (session.status === 'authenticated' && userEmail) {
      setProfile({ session, profile: ddd.profile })
    }
  }, [session])

  return profile
}
