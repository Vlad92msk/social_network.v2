import { awaitSynapse } from 'synapse-storage/react'

import { userMediaSynapse } from './user-media.synapse.ts'

export const userMediaReady = awaitSynapse(userMediaSynapse, {
  loadingComponent: <div>loading</div>,
  errorComponent: (e) => <div>Что то пошло не так</div>,
})
