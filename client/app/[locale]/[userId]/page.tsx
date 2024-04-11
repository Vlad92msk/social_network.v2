import { ContentArea, Layout, MainMenu, SecondMenu } from './_components'

export default async function UserPage() {
  return (
    <Layout
      areas={{
        mainMenu: <MainMenu />,
        secondMenu: <SecondMenu />,
        contentArea: <ContentArea />,
      }}
    />
  )
}
