import { createSynapseCtx } from 'synapse-storage/react'
import { userInfoSynapse } from './user-info.synapse'

export const userInfoSynapseCtx = createSynapseCtx(userInfoSynapse, {
  loadingComponent: <div>loading</div>,
})
