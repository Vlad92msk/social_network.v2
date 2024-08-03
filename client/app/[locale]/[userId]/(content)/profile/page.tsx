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
          content={(
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
          content={<ModulePost posts={['1', '2', '3', '4', '5']} />}
        />
        <ProfileTabItem name="Фото" content={<MyPhoto />} />
        <ProfileTabItem name="Музыка" content={<MyMusic />} />
        <ProfileTabItem name="Видео" content={<MyVideo />} />
      </ProfileTab>
    </PageContent>
  )
}
