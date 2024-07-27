'use client'

import { useProfile } from '@hooks'
import { createZustandContext } from '@utils/client'
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
  const { profile } = useProfile()

  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  return (
    <div className={cn()}>
      <ButtonEdit onSubmit={onSubmit} />
      <Banner contacts={profile?.userInfo.contacts} onClickUser={handleClickFriend} />
      <Name name={name} />
      <Univercity university={university} />
      <Position position={position} />
      <Company company={company} />
      <Information information={information} />
    </div>
  )
})
