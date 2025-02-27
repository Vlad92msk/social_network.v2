import { Locale } from '@middlewares/variables'
import { PageContent } from '@ui/components/PageMainContent'
import { makeCn } from '@utils/others'
import { ModulePost } from 'app/_ui/modules/post'
import { AboutMe, MediaContent, ProfileTab, ProfileTabItem } from './_components'
import style from './Page.module.scss'

const cn = makeCn('Page', style)

export interface UserPageProps {
  params: Promise<{
    locale: Locale
    userId: string
  }>
  searchParams: Promise<{}>
}

export default async function ProfileContent(props: UserPageProps) {
  return (
    <PageContent className={cn()}>
      <ProfileTab activeTab="Обо мне">
        <ProfileTabItem name="Обо мне" content={(<AboutMe />)} />
        <ProfileTabItem name="Публикации" content={<ModulePost />} />
        <ProfileTabItem name="Фото" content={<MediaContent type="image" />} />
        <ProfileTabItem name="Музыка" content={<MediaContent type="audio" />} />
        <ProfileTabItem name="Видео" content={<MediaContent type="video" />} />
      </ProfileTab>
    </PageContent>
  )
}
