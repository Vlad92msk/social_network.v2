import { Locales } from '@middlewares/location'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function PublishContent(props: UserPageProps) {
  return (
    <div>PublishContent</div>
  )
}
