import { createSynapseCtx } from 'synapse-storage/react'
import { coreSynapseIDB } from './core.synapse'

export const coreSynapseCtx = createSynapseCtx(coreSynapseIDB, {
  loadingComponent: <div>loading</div>,
})
