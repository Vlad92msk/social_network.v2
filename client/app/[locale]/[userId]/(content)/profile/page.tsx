import { Locales } from '@middlewares/location'
import { PageMainContent } from '@ui/components/PageMainContent'
import { makeCn } from '@utils/others'
import { AboutMe, Post, PostsList } from './_components'
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
    <PageMainContent className={cn()}>
      <AboutMe />
      <PostsList
        title="Мои публикации"
        posts={[1, 2, 3, 4, 5]}
        renderPosts={(items) => (
          <>
            {items.map((a) => <Post key={a} />)}
          </>
        )}
      />
    </PageMainContent>
  )
}
