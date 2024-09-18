'use client'

import { isNil, omitBy, pick } from 'lodash'
import { useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { createZustandContext } from '@utils/client'
import { DeepPartial } from '@utils/tsUtils'
import { cn } from './cn'
import {
  Banner, ButtonEdit, Company, Information, Name, Position, Univercity,
} from './elements'
import { UserInfoDto } from '../../../../../../../../swagger/userInfo/interfaces-userInfo'
import { userInfoApi } from '../../../../../../../store/api'


// Поля, которые могут быть отредактированы
export interface AboutMeContextChangeState {
  information?: string
  position?: string
  university?: string
  company?: string
  banner?: string
  name?: string
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

  const [updateUser] = userInfoApi.useUpdateUserMutation()
  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  const handleSubmit = (data?: AboutMeContextChangeState) => {
    if (!data) return

    const directFields = pick(data, ['name'])
    const aboutInfoFields = pick(data, ['university', 'company', 'position', 'information'])

    const result: DeepPartial<UserInfoDto> = {
      ...directFields,
      about_info: {
        study: aboutInfoFields.university,
        working: aboutInfoFields.company,
        position: aboutInfoFields.position,
        description: aboutInfoFields.information,
      },
    }

    const cleanResult = omitBy(result, isNil) as UserInfoDto

    updateUser({
      body: cleanResult,
    })
  }

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
      <Name name={profile?.user_info?.name} />
      <Univercity university={profile?.user_info.about_info.study} />
      <Position position={profile?.user_info.about_info.position} />
      <Company company={profile?.user_info.about_info.position} />
      <Information information={profile?.user_info.about_info.description} />
    </div>
  )
})
