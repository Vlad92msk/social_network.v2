import { Locales } from '@middlewares/location'
import { MessengerMain as MessengerComponent } from './_components'

interface MessengerProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default function Messenger(props: MessengerProps){

  return <MessengerComponent />
}
