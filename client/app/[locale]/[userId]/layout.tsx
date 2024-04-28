import { Locales } from '@middlewares/location'
import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'
import { UserSettings } from '../../api/settings/[userId]/route'

const getSettings = async (id: string): Promise<UserSettings> => {
  try {
    const response = await fetch(`http://localhost:3000/api/settings/${id}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch settings')

    return await response.json()
  } catch (error) {
    return { layoutVariant: '222' }
  }
}

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
