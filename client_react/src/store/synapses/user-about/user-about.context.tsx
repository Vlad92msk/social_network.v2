import { createSynapseCtx } from 'synapse-storage/react'

import { userAboutSynapse } from './user-about.synapse.ts'

export const userAboutSynapseCtx = createSynapseCtx(userAboutSynapse, {
  loadingComponent: <div>loading</div>,
})
