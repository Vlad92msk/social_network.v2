import { loggerMiddleware } from '@store/synapses/settings'
import { createApiActions } from '@store/utils/createApiActions.ts'
import { IStorage } from 'synapse-storage/core'
import { createDispatcher } from 'synapse-storage/reactive'

import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { AboutUserStorage } from './user-about.store.ts'

export function createUserInfoDispatcher(store: IStorage<AboutUserStorage>) {
  return createDispatcher({ storage: store, middlewares: [loggerMiddleware] }, (storage, { createAction }) => {
    const userInfoActions = createApiActions<AboutUserStorage, FormData, UserInfo>(storage, createAction, 'updateUserInfo')

    return {
      setCurrentUserProfile: createAction<UserInfo, UserInfo>({
        type: 'setCurrentUserProfile',
        meta: { description: 'Установка полученного профиля (из indexDB)' },
        action: async (userInfo) => {
          const fieldsInit: AboutUserStorage['fieldsInit'] = {
            name: userInfo.name,
            image: userInfo.profile_image,
            banner: userInfo.about_info.banner_image,
            company: userInfo.about_info.working,
            information: userInfo.about_info.description,
            position: userInfo.about_info.position,
            university: userInfo.about_info.study,
          }

          await storage.update((state) => {
            // Сохраняем изначальные данные в том викде какие они есть
            state.userInfoInit = userInfo

            state.fieldsInit = fieldsInit
            // Из полученных данных заполняем конкретные поля

            // Если сделать так же как state.fieldsInit = fieldsInit то подписки на конкретные пути не создадутся стразу
            // Если это не критично - можно делать state.fieldsInit = fieldsInit
            // Если в компонентах создаются селекторы на конкретные значения - лучше делать так:
            state.fields.name = userInfo.name
            state.fields.image = userInfo.profile_image
            state.fields.banner = userInfo.about_info.banner_image
            state.fields.company = userInfo.about_info.working
            state.fields.information = userInfo.about_info.description
            state.fields.position = userInfo.about_info.position
            state.fields.university = userInfo.about_info.study
          })

          return userInfo
        },
      }),

      setActiveChange: createAction<void, void>({
        type: 'setActiveChange',
        meta: { description: 'вкл/выкл редактирование' },
        action: async () => {
          await storage.update((state) => {
            state.isChangeActive = !state.isChangeActive
          })
        },
      }),

      updateField: createAction<Partial<AboutUserStorage['fields']>, Partial<AboutUserStorage['fields']>>({
        type: 'updateField',
        meta: { description: 'Обновление полей' },
        action: async (params) => {
          await storage.update((state) => {
            Object.entries(params).forEach(([key, value]) => {
              // @ts-ignore
              state.fields[key] = value
            })
          })

          return params
        },
      }),

      reset: createAction<void, void>({
        type: 'reset',
        meta: { description: 'Сброс формы' },
        action: async () => {
          await storage.update((state) => {
            state.fields = state.fieldsInit
            state.isChangeActive = !state.isChangeActive
          })
        },
      }),

      submit: createAction<void, FormData>({
        type: 'submit',
        meta: { description: 'Подготовка формы с результатом' },
        action: async () => {
          const result = (await storage.get('fields')) as AboutUserStorage['fields']

          const formData = new FormData()
          if (result.name) formData.append('name', result.name)
          if (result.university) formData.append('about_info[study]', result.university)
          if (result.company) formData.append('about_info[working]', result.company)
          if (result.position) formData.append('about_info[position]', result.position)
          if (result.information) formData.append('about_info[description]', result.information)

          if (result.imageUploadFile && result.imageUploadFile.blob instanceof File) {
            formData.append('profile_image', result.imageUploadFile.blob, result.imageUploadFile.name)
          }

          if (result.bannerUploadFile && result.bannerUploadFile.blob instanceof File) {
            formData.append('banner_image', result.bannerUploadFile.blob, result.bannerUploadFile.name)
          }

          return formData
        },
      }),

      updateUserInfoInit: userInfoActions.init,
      updateUserInfoRequest: userInfoActions.request,
      updateUserInfoSuccess: userInfoActions.success,
      updateUserInfoError: userInfoActions.failure,
    }
  })
}

export type UserAboutDispatcher = ReturnType<typeof createUserInfoDispatcher>
