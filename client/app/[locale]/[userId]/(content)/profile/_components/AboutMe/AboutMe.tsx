'use client'

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
// const { profile } = useProfile()
  const {
    banner, university, company, information, position, name, onSubmit,
  } = props
  return (
    <div className={cn()}>
      <ButtonEdit onSubmit={onSubmit} />
      <Banner />
      <Name name={name} />
      <Univercity university={university} />
      <Position position={position} />
      <Company company={company} />
      <Information information={information} />
    </div>
  )
})
