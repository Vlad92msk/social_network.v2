import { Dialog } from '@api/messenger/dialogs/types/dialogs.type'
import { ProfileType } from '@api/profiles/types/profile.type'
import { Locale } from '@middlewares/variables'
import { DialogsDrawerBar, DialogSelected } from './components'
import { Messenger as MessengerModule } from '@ui/modules/messenger/components/Messenger'

interface MessengerProps {
  params: {
    locale: Locale
    userId: string
  }
  searchParams: {}
  profile: ProfileType | undefined
  dialogs: Dialog[]
}

export async function Messenger(props: MessengerProps) {
  const { params, dialogs, profile } = props
  // await sleep(1000)

  return (
    <MessengerModule dialogsShort={dialogs}>
      <DialogsDrawerBar />
      <DialogSelected />
    </MessengerModule>
  )
}
