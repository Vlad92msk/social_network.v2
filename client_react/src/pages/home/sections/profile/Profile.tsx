import { makeCn } from '@utils'

import { AboutMe, MediaContent, ProfileTab, ProfileTabItem } from './_components'
import style from './Profile.module.scss'

const cn = makeCn('Profile', style)

export interface UserPageProps {}

export const ProfileContent = (props: UserPageProps) => {
  return (
    <div className={cn()}>
      <ProfileTab activeTab="Обо мне">
        <ProfileTabItem name="Обо мне" content={<AboutMe />} />
        {/* <ProfileTabItem name="Публикации" content={<ModulePost />} /> */}
        {/* <ProfileTabItem name="Фото" content={<MediaContent type="image" />} /> */}
        {/* <ProfileTabItem name="Музыка" content={<MediaContent type="audio" />} /> */}
        {/* <ProfileTabItem name="Видео" content={<MediaContent type="video" />} /> */}
      </ProfileTab>
    </div>
  )
}
