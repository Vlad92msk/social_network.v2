import { createSynapse } from 'synapse-storage/utils'
import { notificationsSynapse } from '../notifications/notifications.synapse'
import { createUserInfoDispatcher } from './user-info.dispatcher'
import { userInfoEffects } from './user-info.effects'
import { createUserInfoSelectors } from './user-info.selectors'
import { createUserInfoStorage } from './user-info.store'
import { userInfoEndpoints } from '../../api/user-info.api'
import { coreSynapseIDB } from '../core/core.synapse'

export const userInfoSynapse = await createSynapse({
  dependencies: [coreSynapseIDB],
  createStorageFn: createUserInfoStorage,
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
  effects: [userInfoEffects],
})
