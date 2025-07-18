import { NotificationsDispatcher } from '@store/synapses/notifications'
import { from, of, switchMap, tap, withLatestFrom } from 'rxjs'
import { combineEffects, createEffect, ofType, ofTypes, selectorObject, validateMap } from 'synapse-storage/reactive'

import { UserMediaApi } from '../../api/media.api.ts'
import { CoreDispatcher } from '../core/core.dispatcher'
import { coreSynapseIDB } from '../core/core.synapse'
import { UserMediaDispatcher } from './user-media.dispatcher.ts'
import { UserMediaStorage } from './user-media.store.ts'

type DispatcherType = {
  userMediaDispatcher: UserMediaDispatcher
  coreIdbDispatcher: CoreDispatcher
  notificationDispatcher: NotificationsDispatcher
}
type ApiType = {
  userMediaAPi: UserMediaApi
}

type ExternalStorages = {
  core$: typeof coreSynapseIDB.state$
}

type Effect = ReturnType<typeof createEffect<UserMediaStorage, DispatcherType, ApiType, Record<string, void>, ExternalStorages>>

const moduleEnter: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher }) =>
  action$.pipe(
    ofType(userMediaDispatcher.dispatch.moduleEnter),
    withLatestFrom(
      selectorObject(externalStates.core$, {
        public_id: (s) => s.api.profileInfo.apiData?.user_info.public_id,
      }),
    ),
    switchMap(
      ([
        {
          payload: { mediaType },
        },
        { public_id },
      ]) => {
        return of(
          userMediaDispatcher.dispatch.userMediaInit({
            type: mediaType,
            source: 'user_uploaded_media',
            owner_public_id: public_id,
          }),
        )
      },
    ),
  ),
)

const getUserMedia: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher }, { userMediaAPi }) =>
  action$.pipe(
    ofType(userMediaDispatcher.dispatch.userMediaInit),
    validateMap({
      apiCall: (action) =>
        from(
          userMediaAPi.getFiles.request(action.payload).waitWithCallbacks({
            loading: async (request) => {
              await userMediaDispatcher.dispatch.userMediaRequest(request)
            },
            success: async (data, request) => {
              // console.clear()
              console.log('request', request)
              await userMediaDispatcher.dispatch.userMediaSuccess(request)
              await userMediaDispatcher.dispatch.applyMedia(data!)
            },
            error: async (error, request) => {
              await userMediaDispatcher.dispatch.userMediaError(request)
            },
          }),
        ),
    }),
  ),
)

const updateMedia: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher, notificationDispatcher }, { userMediaAPi }) => {
  return action$.pipe(
    ofType(userMediaDispatcher.dispatch.updateMediaInit),
    validateMap({
      apiCall: (action) => {
        return from(
          userMediaAPi.updateMedia.request(action.payload).waitWithCallbacks({
            loading: async (request) => {
              await userMediaDispatcher.dispatch.updateMediaRequest(request)
            },
            success: async (data, request) => {
              await userMediaDispatcher.dispatch.updateMediaSuccess(request)
              // Показываем уведомление
              notificationDispatcher.dispatch.addNotification({ type: 'success', message: 'Готово' })
            },
            error: async (error, request) => {
              await userMediaDispatcher.dispatch.updateMediaError(request)
              // Можно добавить уведомление об ошибке
            },
          }),
        )
      },
    }),
  )
})

const uploadMedia: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher }, { userMediaAPi }) =>
  action$.pipe(
    ofType(userMediaDispatcher.dispatch.uploadMediaInit),
    validateMap({
      apiCall: (action) =>
        from(
          userMediaAPi.uploadFiles.request(action.payload).waitWithCallbacks({
            loading: async (request) => {
              await userMediaDispatcher.dispatch.uploadMediaRequest(request)
            },
            success: async (data, request) => {
              await userMediaDispatcher.dispatch.uploadMediaSuccess(request)
              await userMediaDispatcher.dispatch.applyMedia(data!)
            },
            error: async (error, request) => {
              await userMediaDispatcher.dispatch.uploadMediaError(request)
            },
          }),
        ),
    }),
  ),
)

const deleteMedia: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher }, { userMediaAPi }) =>
  action$.pipe(
    ofType(userMediaDispatcher.dispatch.deleteMediaInit),
    validateMap({
      apiCall: (action) =>
        from(
          userMediaAPi.deleteFile.request(action.payload).waitWithCallbacks({
            loading: async (request) => {
              await userMediaDispatcher.dispatch.deleteMediaRequest(request)
            },
            success: async (data, request) => {
              await userMediaDispatcher.dispatch.deleteMediaSuccess(request)
              // После успешного удаления можно обновить список
              // или удалить элемент из локального состояния
            },
            error: async (error, request) => {
              await userMediaDispatcher.dispatch.deleteMediaError(request)
            },
          }),
        ),
    }),
  ),
)

const changeWatcher: Effect = createEffect((action$, state$, externalStates, { userMediaDispatcher }) =>
  action$.pipe(
    ofTypes([userMediaDispatcher.dispatch.uploadMediaSuccess, userMediaDispatcher.dispatch.updateMediaSuccess, userMediaDispatcher.dispatch.deleteMediaSuccess]),
    withLatestFrom(
      selectorObject(externalStates.core$, {
        public_id: (s) => s.api.profileInfo.apiData?.user_info.public_id,
      }),
      selectorObject(state$, {
        selectedType: (s) => s.selectedType,
      }),
    ),
    switchMap(([_, { public_id }, { selectedType }]) => {
      return of(
        userMediaDispatcher.dispatch.userMediaInit({
          type: selectedType,
          source: 'user_uploaded_media',
          owner_public_id: public_id,
        }),
      )
    }),
  ),
)

export const userMediaEffects = combineEffects(moduleEnter, getUserMedia, updateMedia, uploadMedia, deleteMedia, changeWatcher)
