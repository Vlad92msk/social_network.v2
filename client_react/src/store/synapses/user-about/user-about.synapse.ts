import { notificationsSynapse } from '@store/synapses/notifications'
import { createSynapse } from 'synapse-storage/utils'

import { userInfoEndpoints } from '../../api/user-info.api'
import { coreSynapseIDB } from '../core/core.synapse'
import { createUserInfoDispatcher } from './user-about.dispatcher.ts'
import { userAboutEffects } from './user-about.effects.ts'
import { createUserInfoSelectors } from './user-about.selectors.ts'
import { createUserAboutStorage } from './user-about.store.ts'

export const userAboutSynapse = await createSynapse({
  dependencies: [coreSynapseIDB, notificationsSynapse],
  createStorageFn: createUserAboutStorage,
  createDispatcherFn: createUserInfoDispatcher,
  createSelectorsFn: createUserInfoSelectors,
  createEffectConfig: (userInfoDispatcher) => ({
    dispatchers: {
      userInfoDispatcher,
      coreIdbDispatcher: coreSynapseIDB.dispatcher,
      notificationDispatcher: notificationsSynapse.dispatcher,
    },
    externalStates: {
      core$: coreSynapseIDB.state$,
    },
    api: {
      userInfoAPi: userInfoEndpoints,
    },
  }),
  effects: [userAboutEffects],
})
