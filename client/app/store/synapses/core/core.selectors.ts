import { ISelectorModule } from 'synapse-storage/core'
import { IDBCore } from '../../types'

export const createUserInfoSelectors = (selectorModule: ISelectorModule<IDBCore>) => {
  const currentUserProfile = selectorModule.createSelector((s) => s.currentUserProfile, {
    name: 'currentUserProfile',
  })

  return ({
    currentUserProfile,
  })
}
