import { notificationsSynapse } from '@store/synapses/notifications'
import { createSynapse } from 'synapse-storage/utils'

import { userMediaEndpoints } from '../../api/media.api.ts'
import { coreSynapseIDB } from '../core/core.synapse'
import { createUserMediaDispatcher } from './user-media.dispatcher.ts'
import { userMediaEffects } from './user-media.effects.ts'
import { createUserMediaSelectors } from './user-media.selectors.ts'
import { createUserMediaStorage } from './user-media.store.ts'

export const userMediaSynapse = await createSynapse({
  dependencies: [coreSynapseIDB, notificationsSynapse],
  createStorageFn: createUserMediaStorage,
  createDispatcherFn: createUserMediaDispatcher,
  createSelectorsFn: createUserMediaSelectors,
  createEffectConfig: (userMediaDispatcher) => ({
    dispatchers: {
      userMediaDispatcher,
      coreIdbDispatcher: coreSynapseIDB.dispatcher,
      notificationDispatcher: notificationsSynapse.dispatcher,
    },
    externalStates: {
      core$: coreSynapseIDB.state$,
    },
    api: {
      userMediaAPi: userMediaEndpoints,
    },
  }),
  effects: [userMediaEffects],
})
