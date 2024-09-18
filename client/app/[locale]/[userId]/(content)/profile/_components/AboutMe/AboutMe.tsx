'use client'

import { AddedFile, useProfile } from '@hooks'
import { QueryStatus } from '@reduxjs/toolkit/query'
import { Spinner } from '@ui/common/Spinner'
import { createZustandContext } from '@utils/client'
import { DeepPartial } from '@utils/tsUtils'
import { isNil, omitBy, pick, size } from 'lodash'
import { useEffect, useState } from 'react'
import { UserInfoDto } from '../../../../../../../../swagger/userInfo/interfaces-userInfo'
import { userInfoApi } from '../../../../../../../store/api'
import { cn } from './cn'
import { Banner, ButtonEdit, Company, Information, Name, Position, Univercity, } from './elements'

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
  const { profile, isLoading } = useProfile()
  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }


  const [updateUser, { data: updatedData, isSuccess }] = userInfoApi.useUpdateUserMutation()
  const [userInfo, setUserInfo] = useState(profile?.user_info)
  useEffect(() => {
    if (isSuccess && updatedData) {
      // @ts-ignore
      setUserInfo(updatedData)
    }
  }, [isSuccess, updatedData])

  const handleSubmit = (data?: AboutMeContextChangeState) => {
    if (!data) return;

    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.university) formData.append('about_info[study]', data.university);
    if (data.company) formData.append('about_info[working]', data.company);
    if (data.position) formData.append('about_info[position]', data.position);
    if (data.information) formData.append('about_info[description]', data.information);

    if (data.imageUploadFile && data.imageUploadFile.blob instanceof File) {
      formData.append('profile_image', data.imageUploadFile.blob, data.imageUploadFile.name);
    } else {
      console.warn('imageUploadFile is not valid:', data.imageUploadFile);
    }

    if (data.bannerUploadFile) {
      formData.append('banner_image', data.bannerUploadFile, data.bannerUploadFile.name);
    }

    updateUser({
      body: formData,
    });
  };

  if (isLoading) return <Spinner />
  return (
    <div className={cn()}>
      <ButtonEdit onSubmit={handleSubmit} />
      <Banner
        contacts={[]}
        image={profile?.user_info?.profile_image}
        bunner_image={profile?.user_info?.about_info.banner_image}
        onClickUser={handleClickFriend}
      />
      <Name name={userInfo?.name} />
      <Univercity university={userInfo?.about_info.study} />
      <Position position={userInfo?.about_info.position} />
      <Company company={userInfo?.about_info.position} />
      <Information information={userInfo?.about_info.description} />
    </div>
  )
})
