import { Locales } from '@middlewares/location'
import { Publication } from '@ui/components/Publication'

interface UserPageProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function ProfileContent(props: UserPageProps) {
  return (
    <Publication>
      <Publication.Author />
      <Publication.ChangeContainer />
      <Publication.MediaContainer />
      <Publication.Text />
      <Publication.Emojies />
      <Publication.Commets />
      <Publication.DateDelivery />
      <Publication.DateCreated />
    </Publication>
  )
}
