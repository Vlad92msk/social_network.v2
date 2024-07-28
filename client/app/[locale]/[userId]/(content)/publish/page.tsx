import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
}

export default async function PublishContent(props: UserPageProps) {
  return (
    <div>PublishContent</div>
  )
}
