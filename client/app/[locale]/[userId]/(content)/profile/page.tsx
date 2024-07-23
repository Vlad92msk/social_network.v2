import { Locales } from '@middlewares/location'
import { PageContent } from '@ui/components/PageMainContent'
import { makeCn } from '@utils/others'
import { AboutMe, Example, Post, PostsList, ProfileTab } from './_components'
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
      <ProfileTab activeTab="Обо мне">
        <Example name="Обо мне" exampleComponent={<AboutMe />} />
        <Example
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
        <Example name="Музыка" exampleComponent={<div>Музыка</div>} />
        <Example name="Видео" exampleComponent={<div>Видео</div>} />
      </ProfileTab>
    </PageContent>
  )
}
