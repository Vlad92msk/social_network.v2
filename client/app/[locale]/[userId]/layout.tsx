import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { getSettings } from '@api/settings/queries'
import { Locale } from '@middlewares/variables'
import { Messenger } from '@ui/modules/messenger'
import { getServerProfile } from '@utils/server'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { getDialogsShortQuery } from './_serverQueries/getDialogsShortQuery.query'
import { CookieType } from '../../types/cookie'

interface UserPageProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
  children: React.ReactNode
}

export default async function UserPage(props: UserPageProps) {
  const { params: { userId, locale }, children } = props
  const cookieStore = cookies()

  const { layoutVariant } = await getSettings(userId)
  const profile = await getServerProfile()

  const data = await getDialogsShortQuery({
    userId,
    locale,
    userInfoIdCookie: cookieStore.get(CookieType.USER_INFO_ID),
    profileIdCookie: cookieStore.get(CookieType.USER_PROFILE_ID),
  })

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
                dialogs={data}
              />
            </Suspense>
          </ContentArea>
        ),
      }}
    />
  )
}
