import { useSession } from 'next-auth/react'
import { useSelector as useSelectorSynapse } from 'synapse-storage/react'
import { coreSynapseIDB } from '../../store/synapses/core/core.synapse'
const { selectors } = coreSynapseIDB

export const useProfile = () => {
  const session = useSession()
  const { data, isLoading } = useSelectorSynapse(selectors.currentUserProfile, { withLoading: true })

  const isLoading1 = session.status === 'loading' && isLoading
  return { profile: data, session, isLoading: isLoading1 }
}
