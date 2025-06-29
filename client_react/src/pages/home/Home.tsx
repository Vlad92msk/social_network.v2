import { Suspense } from 'react'
import { ContentArea, MainMenu, ProfileLayout, SecondMenu } from '@components/app-layout'

import { ProfileContent } from './sections/profile/Profile.tsx'

export const Home = () => {
  const userSettings = {
    layoutVariant: '2',
  }

  return (
    <ProfileLayout
      layoutVariant={userSettings.layoutVariant}
      areas={{
        mainMenu: <MainMenu />,
        secondMenu: <SecondMenu layoutVariant={userSettings.layoutVariant} />,
        content: (
          <ContentArea>
            <ProfileContent />
            <Suspense fallback={<div>.........Loading..........</div>}>
              {/* <Messenger */}
              {/*   params={params} // Теперь передаем уже разрешенные params */}
              {/*   searchParams={(await props.searchParams)} */}
              {/*   profile={profile} */}
              {/* /> */}
            </Suspense>
          </ContentArea>
        ),
      }}
    />
  )
}
