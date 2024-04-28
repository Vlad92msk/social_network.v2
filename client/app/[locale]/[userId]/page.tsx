import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'

const layoutVariant = '2'

export default async function UserPage() {
  return (
    <Layout
      layoutVariant={layoutVariant}
      areas={{
        mainMenu: <MainMenu />,
        secondMenu: <SecondMenu layoutVariant={layoutVariant} />,
        contentArea: <ContentArea />,
      }}
    />
  )
}
