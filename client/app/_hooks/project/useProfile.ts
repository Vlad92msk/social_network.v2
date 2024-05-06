import { useSession } from 'next-auth/react'
import { SessionContextValue } from 'next-auth/src/react'
import { useEffect, useState } from 'react'
import { ProfileType } from '@api/profiles/types/profile.type'
import { getProfileQuery } from '../../_query'

interface UserProfile {
  session: SessionContextValue
  profile?: ProfileType
}

export const useProfile = () => {
  const session = useSession()

  const [profile, setProfile] = useState<UserProfile>({ profile: undefined, session })

  useEffect(() => {
    const userEmail = session.data?.user?.email

    if (session.status === 'authenticated' && userEmail) {
      getProfileQuery(userEmail as string).then(
        (profile) => setProfile({ session, profile }),
      )
    }
  }, [session])

  return profile
}
