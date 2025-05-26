'use client'

import { Spinner } from '@ui/common/Spinner'
import { useSession } from 'next-auth/react'
import { PropsWithChildren } from 'react'
import { createSynapseCtx, useSelector } from 'synapse-storage/react'
import { coreSynapseIDB } from '../../store/synapses/core/core.synapse'

const { selectors } = coreSynapseIDB

export const {
  contextSynapse: contexCoretSynapse,
  // useSynapseStorage: useCoreSynapseStorage,
  // useSynapseSelectors: useCoreSynapseSelectors,
  // useSynapseActions: useCoreSynapseActions,
  // useSynapseState$: useCoreSynapseState$,
  cleanupSynapse: cleanupCoreSynapse,
} = createSynapseCtx(coreSynapseIDB, {
  loadingComponent: <div>loading</div>,
})

interface CoreProviderCtx {
  currentUserProfile: any
}
interface CoreProviderProps extends PropsWithChildren{
}

export const CoreProvider = contexCoretSynapse<CoreProviderProps, CoreProviderCtx>((props) => {
  const session = useSession()
  const { data: currentUserData, isLoading: currentUserLoadingStatus } = useSelector(selectors.currentUserProfile, { withLoading: true })
  const isLoading = session.status === 'loading' || currentUserLoadingStatus
  if (isLoading) return <Spinner />
  // if (!currentUserData || !session.data) return <div>Нет данных о пользователе</div>
  // console.log('session', session)
  // console.log('currentUserData', currentUserData)
  return (
    <>
      {props.children}
    </>
  )
})
