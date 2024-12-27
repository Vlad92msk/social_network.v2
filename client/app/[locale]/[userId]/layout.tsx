import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSettings } from '@api/settings/queries'
import { Locale } from '@middlewares/variables'
import { Messenger } from '@ui/modules/messenger'
import { getServerProfile } from '@utils/server'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { getUserQuery } from './_serverQueries/getUser.query'
import { CookieType } from '../../types/cookie'

interface UserPageProps {
  params: Promise<{
    locale: Locale
    userId: string
  }>
  searchParams: Promise<{}>
  children: React.ReactNode
}

export default async function UserPage(props: UserPageProps) {
  // Получаем params с помощью await
  const params = await props.params
  const { userId, locale } = params
  const { children } = props

  const cookieStore = await cookies()

  const { layoutVariant } = await getSettings(userId)
  const profile = await getServerProfile()

  const checkedUser = await getUserQuery({
    public_id: userId,
    userInfoIdCookie: cookieStore.get(CookieType.USER_INFO_ID),
    profileIdCookie: cookieStore.get(CookieType.USER_PROFILE_ID),
  })

  if (!checkedUser) redirect(`/${locale}/${profile?.user_info.public_id}/profile`)

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
                params={params} // Теперь передаем уже разрешенные params
                searchParams={(await props.searchParams)}
                profile={profile}
              />
            </Suspense>
          </ContentArea>
        ),
      }}
    />
  )
}
