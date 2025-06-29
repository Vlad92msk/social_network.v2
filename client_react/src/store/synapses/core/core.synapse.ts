import { createSynapse } from 'synapse-storage/utils'

import { browserStorage } from '../../../utils/browser-storage.ts'
import { userProfileEndpoints } from '../../api/profile.api'
import { CORE } from '../../indexdb.config'
import { createCoreDispatcher } from './core.dispatcher'
import { userProfileEffects } from './core.effects'
import { createUserInfoSelectors } from './core.selectors'

export const coreSynapseIDB = await createSynapse({
  storage: CORE,
  createSelectorsFn: createUserInfoSelectors,
  createDispatcherFn: createCoreDispatcher,
  createEffectConfig: (coreDispatcher) => ({
    dispatchers: {
      coreDispatcher,
    },
    api: {
      userProfileAPi: userProfileEndpoints,
    },
    config: {
      browserStorage,
    },
  }),
  effects: [userProfileEffects],
})
