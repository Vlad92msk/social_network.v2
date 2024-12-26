import { useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import { ProfileSelectors } from '../../../store/profile.slice'

export const useProfile = () => {
  const session = useSession()
  const { profile } = useSelector(ProfileSelectors.selectProfile)

  return { profile, session, isLoading: session.status === 'loading' }
}
