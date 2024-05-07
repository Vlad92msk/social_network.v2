import { Dialog } from '@api/messenger/dialogs/types/dialogs.type'
import { ProfileType } from '@api/profiles/types/profile.type'
import { Locales } from '@middlewares/location'
import { DialogsDrawerBar, DialogSelected } from './_components'
import { Messenger as MessengerModule } from './_components/Messenger'
import { DialogListProvider } from './_providers/dialogList'
import { DialogSelectedProvider } from './_providers/dialogSelected'

interface MessengerProps {
  params: {
    locale: Locales
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
    <MessengerModule
      communicate={(
        <DialogListProvider dialogsShort={dialogs}>
          <DialogsDrawerBar />
        </DialogListProvider>
    )}
      chat={(
        <DialogSelectedProvider>
          <DialogSelected />
        </DialogSelectedProvider>
      )}
    />
  )
}
