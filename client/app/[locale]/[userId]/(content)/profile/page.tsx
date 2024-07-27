import { Locales } from '@middlewares/location'
import { PageContent } from '@ui/components/PageMainContent'
import { makeCn } from '@utils/others'
import { AboutMe, Post, PostsList, ProfileTab, ProfileTabItem } from './_components'
import style from './Page.module.scss'

const cn = makeCn('Page', style)

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function ProfileContent(props: UserPageProps) {
  return (
    <PageContent className={cn()}>
      <ProfileTab activeTab="Публикации">
        <ProfileTabItem
          name="Обо мне"
          exampleComponent={(
            <AboutMe
              position="Frontend-developer"
              university="МГПУ"
              company={'ООО "42"'}
              name="Фирсов Влад"
              // события должны обрабатываться на стороне клиента
              // onSubmit={(infoChanged) => console.log('изменил инф о себе', infoChanged)}
            />
        )}
        />
        <ProfileTabItem
          name="Публикации"
          exampleComponent={(
            <PostsList
              title="Мои публикации"
              posts={[1, 2, 3, 4, 5]}
              renderPosts={(items) => (
                <>
                  {items.map((a) => <Post key={a} />)}
                </>
              )}
            />
          )}
        />
        <ProfileTabItem name="Музыка" exampleComponent={<div>Музыка</div>} />
        <ProfileTabItem name="Видео" exampleComponent={<div>Видео</div>} />
      </ProfileTab>
    </PageContent>
  )
}
