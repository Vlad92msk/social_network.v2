import { Locales } from '@middlewares/location'
import { makeCn } from '@utils/others'
import { Pub } from './_components/Publication'
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
    <div className={cn()}>
      <Pub />
    </div>
  )
}
