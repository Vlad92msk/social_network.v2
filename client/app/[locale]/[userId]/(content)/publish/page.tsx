import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: Promise<{
    locale: Locale
    userId: string
  }>
  searchParams: Promise<{}>
}

export default async function PublishContent(props: UserPageProps) {
  return (
    <div>PublishContent</div>
  )
}
