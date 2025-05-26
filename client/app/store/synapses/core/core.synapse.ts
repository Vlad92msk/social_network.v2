import { createSynapse } from 'synapse-storage/utils'
import { createCoreDispatcher } from './core.dispatcher'
import { userProfileEffects } from './core.effects'
import { createUserInfoSelectors } from './core.selectors'
import { userProfileEndpoints } from '../../api/profile.api'
import { CORE } from '../../indexdb.config'

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
  }),
  effects: [userProfileEffects],
})
