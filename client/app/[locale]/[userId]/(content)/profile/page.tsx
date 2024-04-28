import { Locales } from '@middlewares/location'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function ProfileContent(props: UserPageProps) {
  console.log('profile')
  return (
    <div>ProfileContent</div>
  )
}
