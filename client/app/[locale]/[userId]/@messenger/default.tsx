import { Locales } from '@middlewares/location'

interface MessengerProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default function Messenger (props: MessengerProps){

  return <div>DefaultMEssenger</div>
}
