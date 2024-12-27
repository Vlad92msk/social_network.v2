import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: Promise<{
    locale: Locale
    userId: string
  }>
  searchParams: Promise<{}>
}

export default async function MusicContent(props: UserPageProps) {
  return (
    <div>MusicContent</div>
  )
}
