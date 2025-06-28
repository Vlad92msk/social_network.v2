import { ISelectorModule } from 'synapse-storage/core'
import { IDBCore } from '../../types'

export const createUserInfoSelectors = (selectorModule: ISelectorModule<IDBCore>) => {
  const currentUserProfileApi = selectorModule.createSelector((s) => s.api.profileInfo, {
    name: 'currentUserProfile',
  })

  const currentUserProfile = selectorModule.createSelector(
    [currentUserProfileApi],
    (s) => s.apiData
  )

  return ({
    currentUserProfile,
  })
}
