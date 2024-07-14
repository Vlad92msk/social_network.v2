import { Locales } from '@middlewares/location'
import { Pub } from './_components/Publication'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function ProfileContent(props: UserPageProps) {
  return (
    <Pub />
  )
}
