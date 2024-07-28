import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
}

export default async function MusicContent(props: UserPageProps) {
  return (
    <div>MusicContent</div>
  )
}
