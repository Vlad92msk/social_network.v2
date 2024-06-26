import { getServerSession } from 'next-auth'
import { Suspense } from 'react'
import { Locales } from '@middlewares/location'
import { getProfileQuery } from '../../api/profiles/queries'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { Messenger } from './_modules/messenger'
import { getDialogsShortQuery } from '../../api/messenger/dialogs/queries'
import { getSettings } from '../../api/settings/queries'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
  children: React.ReactNode
}

export default async function UserPage(props: UserPageProps) {
  const { params: { userId }, children } = props
  const { layoutVariant } = await getSettings(userId)

  const serverSession = await getServerSession()
  const profile = await getProfileQuery(serverSession?.user?.email as string)
  const dialogs = await getDialogsShortQuery(profile?.dialogsIds)

  return (
    <Layout
      layoutVariant={layoutVariant}
      areas={{
        mainMenu: <MainMenu />,
        secondMenu: <SecondMenu layoutVariant={layoutVariant} />,
        content: (
          <ContentArea>
            {children}
            <Suspense fallback={<div>.........Loading..........</div>}>
              <Messenger
                params={props.params}
                searchParams={props.searchParams}
                profile={profile}
                dialogs={dialogs}
              />
            </Suspense>
          </ContentArea>
        ),
      }}
    />
  )
}
