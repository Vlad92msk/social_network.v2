import { Locales } from '@middlewares/location'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function MusicContent(props: UserPageProps) {
  return (
    <div>MusicContent</div>
  )
}
