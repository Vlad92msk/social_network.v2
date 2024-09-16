'use client'

import { useProfile } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { createZustandContext } from '@utils/client'
import { useDispatch, useSelector } from 'react-redux'
import { tagsApi } from '../../../../../../../store/api'
import { ProfileSelectors, ProfileSliceActions } from '../../../../../../../store/profile.slice'
import { cn } from './cn'
import {
  Banner, ButtonEdit, Company, Information, Name, Position, Univercity,
} from './elements'

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

export interface AboutMeProps extends AboutMeContextChangeState {
  onSubmit?: (data?: AboutMeContextChangeState) => void
}

export const AboutMe = contextZustand<AboutMeProps, PublicationContextState>((props) => {
  const {
    banner, university, company, information, position, name, onSubmit,
  } = props
  const dispatch = useDispatch()
  // @ts-ignore
  const ddd = useSelector(ProfileSelectors.selectProfile)
  // const { profile } = useProfile()
console.log('ddd', ddd)
  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  // const {data} = tagsApi.useFindTagsQuery(undefined)
  // console.log('useFindTagsQuery',data.)

  return (
    <div className={cn()}>
      <button onClick={()=> dispatch({type: 'FETCH_TAGS'})}>test</button>
      <ButtonEdit onSubmit={onSubmit} />
      {/* <Banner contacts={profile?.userInfo.contacts} onClickUser={handleClickFriend} /> */}
      <Name name={name} />
      <Univercity university={university} />
      <Position position={position} />
      <Company company={company} />
      <Information information={information} />
    </div>
  )
})
