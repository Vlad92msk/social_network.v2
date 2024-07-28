import { Locale } from '@middlewares/variables'

interface UserPageProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
}

export default async function VideoContent(props: UserPageProps) {
  return (
    <div>VideoContent</div>
  )
}
