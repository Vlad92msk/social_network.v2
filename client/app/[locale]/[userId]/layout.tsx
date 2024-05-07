import { Suspense } from 'react'
import { Locales } from '@middlewares/location'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { Messenger } from './_modules/messenger'
import { getSettings } from './_query'

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
              <Messenger params={props.params} searchParams={props.searchParams} />
            </Suspense>
          </ContentArea>
        ),
      }}
    />
  )
}
