import { Locale } from '@middlewares/variables'
import { Messenger as MessengerModule } from '@ui/modules/messenger/components/Messenger'
import { DialogShortDto } from '../../../../../swagger/dialogs/interfaces-dialogs'
import { DialogsDrawerBar, DialogSelected } from './components'
import { UserProfileInfo } from '../../../../../swagger/profile/interfaces-profile'

interface MessengerProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
  profile: UserProfileInfo | undefined
}

export async function Messenger(props: MessengerProps) {
  const { params, profile } = props
  // await sleep(1000)

  return (
    <MessengerModule>
      <DialogsDrawerBar />
      <DialogSelected />
    </MessengerModule>
  )
}
