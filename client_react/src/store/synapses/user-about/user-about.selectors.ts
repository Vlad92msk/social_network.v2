import { ISelectorModule } from 'synapse-storage/core'

import { AboutUserStorage } from './user-about.store.ts'

export const createUserInfoSelectors = (selectorModule: ISelectorModule<AboutUserStorage>) => {
  const currentUserProfile = selectorModule.createSelector((s) => s.userInfoInit)
  const fieldsInit = selectorModule.createSelector((s) => s.fieldsInit)

  const isChangeActive = selectorModule.createSelector((s) => s.isChangeActive)

  const fields = selectorModule.createSelector((s) => s.fields)
  const fieldInformation = selectorModule.createSelector((s) => s.fields.information)
  const fieldPosition = selectorModule.createSelector((s) => s.fields.position)
  const fieldUniversity = selectorModule.createSelector((s) => s.fields.university)
  const fieldCompany = selectorModule.createSelector((s) => s.fields.company)
  const fieldbanner = selectorModule.createSelector((s) => s.fields.banner)
  const fieldImage = selectorModule.createSelector((s) => s.fields.image)
  const fieldImageUploadFile = selectorModule.createSelector((s) => s.fields.imageUploadFile)
  const fieldName = selectorModule.createSelector((s) => s.fields.name)

  return {
    currentUserProfile,
    isChangeActive,
    fields,
    fieldsInit,

    fieldInformation,
    fieldPosition,
    fieldUniversity,
    fieldCompany,
    fieldbanner,
    fieldImageUploadFile,
    fieldImage,
    fieldName,
  }
}
