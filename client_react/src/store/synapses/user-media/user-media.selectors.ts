import { ISelectorModule } from 'synapse-storage/core'

import { MediaEntity } from '../../../../../swagger/media/interfaces-media.ts'
import { UserMediaStorage } from './user-media.store.ts'

export const createUserMediaSelectors = (selectorModule: ISelectorModule<UserMediaStorage>) => {
  const api = selectorModule.createSelector((s) => s.api)
  const selectedType = selectorModule.createSelector((s) => {
    console.log('Selector selectedType called with state:', s)
    console.log('Returning selectedType:', s.selectedType)
    return s.selectedType
  })
  const media = selectorModule.createSelector((s) => s.media)

  // API селекторы для получения медиа
  const getMediaApi = selectorModule.createSelector([api], (s) => s.getMediaRequest)
  const getMediaApiData = selectorModule.createSelector([getMediaApi], (s) => s.apiData)
  const getMediaApiStatus = selectorModule.createSelector([getMediaApi], (s) => s.apiStatus)
  const getMediaApiError = selectorModule.createSelector([getMediaApi], (s) => s.apiError)

  // API селекторы для загрузки медиа
  const uploadMediaApi = selectorModule.createSelector([api], (s) => s.uploadMediaRequest)
  const uploadMediaApiData = selectorModule.createSelector([uploadMediaApi], (s) => s.apiData)
  const uploadMediaApiStatus = selectorModule.createSelector([uploadMediaApi], (s) => s.apiStatus)
  const uploadMediaApiError = selectorModule.createSelector([uploadMediaApi], (s) => s.apiError)

  // API селекторы для обновления медиа
  const updateMediaApi = selectorModule.createSelector([api], (s) => s.updateMediaRequest)
  const updateMediaApiData = selectorModule.createSelector([updateMediaApi], (s) => s.apiData)
  const updateMediaApiStatus = selectorModule.createSelector([updateMediaApi], (s) => s.apiStatus)
  const updateMediaApiError = selectorModule.createSelector([updateMediaApi], (s) => s.apiError)

  const deleteMediaApi = selectorModule.createSelector([api], (s) => s.deleteMediaRequest)
  const deleteMediaApiData = selectorModule.createSelector([deleteMediaApi], (s) => s.apiData)
  const deleteMediaApiStatus = selectorModule.createSelector([deleteMediaApi], (s) => s.apiStatus)
  const deleteMediaApiError = selectorModule.createSelector([deleteMediaApi], (s) => s.apiError)

  // Селектор для получения медиа выбранного типа
  const selectedMedia = selectorModule.createSelector([media, selectedType], (m, s) => {
    if (!s || !m[s]) {
      return [] as MediaEntity[]
    }
    return m[s]
  })

  // Селектор для проверки загрузки
  const isLoading = selectorModule.createSelector(
    [getMediaApiStatus, uploadMediaApiStatus, updateMediaApiStatus, deleteMediaApiStatus],
    (getStatus, uploadStatus, updateStatus, deleteStatus) => getStatus === 'loading' || uploadStatus === 'loading' || updateStatus === 'loading' || deleteStatus === 'loading',
  )

  // Обновите селектор для проверки наличия ошибок
  const hasError = selectorModule.createSelector(
    [getMediaApiError, uploadMediaApiError, updateMediaApiError, deleteMediaApiError],
    (getError, uploadError, updateError, deleteError) => Boolean(getError || uploadError || updateError || deleteError),
  )

  // Селектор для получения всех ошибок
  const allErrors = selectorModule.createSelector(
    [getMediaApiError, uploadMediaApiError, updateMediaApiError, deleteMediaApiError],
    (getError, uploadError, updateError, deleteError) => ({
      getError,
      uploadError,
      updateError,
      deleteError,
    }),
  )

  return {
    // Основные селекторы
    selectedType,
    selectedMedia,
    media,

    // Состояния загрузки и ошибок
    isLoading,
    hasError,
    allErrors,

    // API селекторы для получения медиа
    getMediaApiData,
    getMediaApiStatus,
    getMediaApiError,

    // API селекторы для загрузки медиа
    uploadMediaApiData,
    uploadMediaApiStatus,
    uploadMediaApiError,

    // API селекторы для обновления медиа
    updateMediaApiData,
    updateMediaApiStatus,
    updateMediaApiError,

    // API селекторы для удаления медиа
    deleteMediaApiData,
    deleteMediaApiStatus,
    deleteMediaApiError,
  }
}
