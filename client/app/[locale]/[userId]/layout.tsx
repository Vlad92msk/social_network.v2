import { Locales } from '@middlewares/location'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { getSettings } from './_query'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
  messenger: React.ReactNode
  children: React.ReactNode
}

export default async function UserPage(props: UserPageProps) {
  const { params: { userId }, messenger, children } = props
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
            {messenger}
          </ContentArea>
        ),
      }}
    />
  )
}
