import { Spinner } from '@components/ui'
import { userAboutSynapse, userAboutSynapseCtx } from '@store/synapses/user-about'
import { useSelector } from 'synapse-storage'

import { useAuth } from '../../../../../../auth'
import { cn } from './cn'
import { Banner, ButtonEdit, Company, Information, Name, Position, Univercity } from './elements'

const { selectors } = userAboutSynapse

export interface AboutMeProps {}

export const AboutMe = userAboutSynapseCtx.contextSynapse<AboutMeProps, void>((props) => {
  const { isLoading } = useAuth()

  const handleClickFriend = (id: string) => {
    console.log(`Переходим к пользователю ${id}`)
  }

  const currentUserProfile = useSelector(selectors.currentUserProfile)

  return (
    <div className={cn()}>
      {isLoading ? (
        <Spinner />
      ) : (
        currentUserProfile && (
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
      )}
    </div>
  )
})
