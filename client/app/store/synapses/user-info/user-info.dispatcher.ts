import { IStorage } from 'synapse-storage/core'
import { createDispatcher, loggerDispatcherMiddleware } from 'synapse-storage/reactive'
import { AboutUserUserInfo } from './user-info.store'
import { UserInfo } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { ReceivedResponse } from '../../../types/apiStatus'
import { apiRequestStore } from '../../utils/apiRequest.store-util'

export function createUserInfoDispatcher(store: IStorage<AboutUserUserInfo>) {


  return createDispatcher({ storage: store }, (storage, { createAction }) => ({
    setCurrentUserProfile: createAction<UserInfo, UserInfo>({
      type: 'setCurrentUserProfile',
      meta: { description: 'Установка полученного профиля (из indexDB)' },
      action: async (userInfo) => {
        const fieldsInit: AboutUserUserInfo['fieldsInit'] = {
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

    updateField: createAction<Partial<AboutUserUserInfo['fields']>, Partial<AboutUserUserInfo['fields']>>({
      type: 'updateField',
      meta: { description: 'Обновление полей' },
      action: async (params) => {
        await storage.update((state) => {
          Object.entries(params).forEach(([key, value]) => {
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
        const result = await storage.get('fields') as AboutUserUserInfo['fields']

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

    updateUserInfoInit: createAction<FormData, FormData>({
      type: 'updateUserInfoInit',
      meta: { description: 'Хотим отправить запрос на обновление профиля пользователя' },
      action: async (formData) => formData,
    }),
    updateUserInfoRequest: createAction<ReceivedResponse<UserInfo, FormData>, ReceivedResponse<UserInfo, FormData>>({
      type: 'updateUserInfoRequest',
      meta: { description: 'Отправляем запрос на обновление профиля пользователя' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'updateUserInfo', 'request')
        return responseData
      },
    }),
    updateUserInfoSuccess: createAction<ReceivedResponse<UserInfo>, ReceivedResponse<UserInfo>>({
      type: 'updateUserInfoSuccess',
      meta: { description: 'Профиль пользователя успешно обновлен, получили ответ' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'updateUserInfo', 'success')

        return responseData
      },
    }),
    updateUserInfoError: createAction<ReceivedResponse<UserInfo>, ReceivedResponse<UserInfo>>({
      type: 'updateUserInfoError',
      meta: { description: 'Ошибка в запросе обновления профиля пользователя' },
      action: async (responseData) => {
        await apiRequestStore(storage, responseData, 'updateUserInfo', 'failure')
        return responseData
      },
    }),
  }))
}

export type UserInfoDispatcher = ReturnType<typeof createUserInfoDispatcher>
