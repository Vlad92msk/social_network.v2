import { Locale } from '@middlewares/variables'
import { PageContent } from '@ui/components/PageMainContent'
import { makeCn } from '@utils/others'
import { ModulePost } from 'app/_ui/modules/post'
import { AboutMe, MyMusic, MyPhoto, MyVideo, ProfileTab, ProfileTabItem } from './_components'
import style from './Page.module.scss'

const cn = makeCn('Page', style)

interface UserPageProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
}

export default async function ProfileContent(props: UserPageProps) {
  return (
    <PageContent className={cn()}>
      <ProfileTab activeTab="Фото">
        <ProfileTabItem
          name="Обо мне"
          content={(<AboutMe />)}
        />
        <ProfileTabItem
          name="Публикации"
          content={<ModulePost />}
        />
        <ProfileTabItem name="Фото" content={<MyPhoto />} />
        <ProfileTabItem name="Музыка" content={<MyMusic />} />
        <ProfileTabItem name="Видео" content={<MyVideo />} />
      </ProfileTab>
    </PageContent>
  )
}
