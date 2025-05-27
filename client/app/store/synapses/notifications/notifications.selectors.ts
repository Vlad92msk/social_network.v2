import { ISelectorModule } from 'synapse-storage/core'
import { NotificationsStore } from './notifications.store'

export const createUserInfoSelectors = (selectorModule: ISelectorModule<NotificationsStore>) => {
  const notifications = selectorModule.createSelector((s) => s.notifications)


  return ({
    notifications,
  })
}
