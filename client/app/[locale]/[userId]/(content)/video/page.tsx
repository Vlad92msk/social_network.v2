import { Locales } from '@middlewares/location'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function VideoContent(props: UserPageProps) {
  return (
    <div>VideoContent</div>
  )
}
