import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: Promise<{
    locale: Locale
    userId: string
  }>
  searchParams: Promise<{}>
}

export default async function VideoContent(props: UserPageProps) {
  return (
    <div>VideoContent</div>
  )
}
