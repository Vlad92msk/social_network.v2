import { coreSynapseCtx } from '@store/synapses/core/core.context.tsx'
import { coreSynapseIDB } from '@store/synapses/core/core.synapse.ts'
import { PropsWithChildren, useEffect } from 'react'
import { useAuth } from '../../auth'

const { actions } = coreSynapseIDB

interface CoreProps {}

export const Core = coreSynapseCtx.contextSynapse<PropsWithChildren<CoreProps>, void>((props) => {
  const { children } = props
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      actions.moduleEnter({
        email: user!.email
      })
    }
  }, [isAuthenticated])

  return (
    <>{children}</>
  )
})
