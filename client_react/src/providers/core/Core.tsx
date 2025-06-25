import { coreSynapseCtx } from '@store/synapses/core/core.context.tsx'
import { PropsWithChildren } from 'react'

interface CoreProps {}

export const Core = coreSynapseCtx.contextSynapse<PropsWithChildren<CoreProps>, void>((props) => {
const { children } = props
  return (
    <>{children}</>
  )
})
