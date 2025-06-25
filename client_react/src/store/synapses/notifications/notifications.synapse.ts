import { createSynapse } from 'synapse-storage/utils'
import { createNotificationsDispatcher } from './notifications.dispatcher'
import { createUserInfoSelectors } from './notifications.selectors'
import { createUserInfoStorage } from './notifications.store'

export const notificationsSynapse = await createSynapse({
  createStorageFn: createUserInfoStorage,
  createDispatcherFn: createNotificationsDispatcher,
  createSelectorsFn: createUserInfoSelectors,
  createEffectConfig: (currentDispatcher) => ({
    dispatchers: {
      currentDispatcher,
    },
  }),
})
