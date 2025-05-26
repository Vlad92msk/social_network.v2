'use client'

import { useProfile } from '@hooks'
import { Spinner } from '@ui/common/Spinner'
import { useParams } from 'next/navigation'
import { userInfoSynapseCtx } from '../../../../../../store/synapses/user-info/user-info.context'
import { UserPageProps } from '../../page'
import { cn } from './cn'
import { Banner, ButtonEdit, Company, Information, Name, Position, Univercity, } from './elements'

export interface AboutMeProps {
}

export const AboutMe = userInfoSynapseCtx.contextSynapse<AboutMeProps, void>((props) => {
  // @ts-ignore
  const params = useParams<UserPageProps['params']>()

  const { profile, isLoading } = useProfile()

  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  return (
    <div className={cn()}>
      {
        isLoading ? <Spinner /> : profile && (
          <>
            <ButtonEdit />
            <Banner onClickUser={handleClickFriend} />
            <Name />
            <Univercity />
            <Position />
            <Company />
            <Information />
          </>
        )
      }
    </div>
  )
})
