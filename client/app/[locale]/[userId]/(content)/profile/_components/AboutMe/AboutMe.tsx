'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AddedFile, useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { createZustandContext } from '@utils/client'
import { cn } from './cn'
import {
  Banner, ButtonEdit, Company, Information, Name, Position, Univercity,
} from './elements'
import { userInfoApi } from '../../../../../../../store/api'
import { UserPageProps } from '../../page'

// Поля, которые могут быть отредактированы
export interface AboutMeContextChangeState {
  information?: string
  position?: string
  university?: string
  company?: string
  banner?: string
  name?: string
  bannerUploadFile?: AddedFile
  imageUploadFile?: AddedFile
}

interface PublicationContextState {
  isChangeActive?: boolean
  changeState?: AboutMeContextChangeState
  status?: 'view' | 'reset' | 'approve'
}

const initialState: PublicationContextState = {
  isChangeActive: false,
  status: 'view',
  changeState: {},
}

export const {
  contextZustand,
  useZustandSelector: useAboutMeCtxSelect,
  useZustandDispatch: useAboutMeCtxUpdate,
} = createZustandContext(initialState)

export interface AboutMeProps {
}

export const AboutMe = contextZustand<AboutMeProps, PublicationContextState>((props) => {
  const params = useParams<UserPageProps['params']>()
  const aboutMeUpdate = useAboutMeCtxUpdate()

  const { profile, isLoading } = useProfile()

  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  /**
   * Получаем инф о пользователе если это не текущий пользователь
   * (чтобы отображать инф о пользователе из URL)
   */
  const { data: gotUserProfile, status } = userInfoApi.useGetUsersQuery(
    { public_id: params.userId },
    { skip: profile?.user_info.public_id === params.userId },
  )
  const [updateUser, { isError }] = userInfoApi.useUpdateUserMutation()

  useEffect(() => {
    if (isError) {
      aboutMeUpdate(() => ({ isChangeActive: false, status: 'reset', changeState: {} }))
    }
  }, [aboutMeUpdate, isError])

  const handleSubmit = (data?: AboutMeContextChangeState) => {
    if (!data) return

    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.university) formData.append('about_info[study]', data.university)
    if (data.company) formData.append('about_info[working]', data.company)
    if (data.position) formData.append('about_info[position]', data.position)
    if (data.information) formData.append('about_info[description]', data.information)

    if (data.imageUploadFile && data.imageUploadFile.blob instanceof File) {
      formData.append('profile_image', data.imageUploadFile.blob, data.imageUploadFile.name)
    }

    if (data.bannerUploadFile && data.bannerUploadFile.blob instanceof File) {
      formData.append('banner_image', data.bannerUploadFile.blob, data.bannerUploadFile.name)
    }

    updateUser({
      // @ts-ignore
      body: formData,
    })
  }

  const [currentUser, setCurrentUser] = useState(profile?.user_info)

  useEffect(() => {
    if (profile?.user_info.public_id !== params.userId && status === 'fulfilled' && gotUserProfile?.length) {
      // @ts-ignore
      setCurrentUser(gotUserProfile[0])
    }
  }, [gotUserProfile, params, profile, status])

  return (
    <div className={cn()}>
      {
        isLoading ? <Spinner /> : currentUser && (
          <>
            <ButtonEdit onSubmit={handleSubmit} />
            <Banner
              contacts={[]}
              image={currentUser.profile_image}
              bunner_image={currentUser.about_info.banner_image}
              onClickUser={handleClickFriend}
            />
            <Name name={currentUser.name} />
            <Univercity university={currentUser.about_info.study} />
            <Position position={currentUser.about_info.position} />
            <Company company={currentUser.about_info.working} />
            <Information information={currentUser.about_info.description} />
          </>
        )
      }
    </div>
  )
})
