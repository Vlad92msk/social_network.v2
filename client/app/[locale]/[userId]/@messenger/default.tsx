import { Locales } from '@middlewares/location'
import { DialogsDrawerBar, DialogSelected } from './_components'
import { Messenger as MessengerModule } from './_components/Messenger'
import { DialogSelectedProvider } from './_providers/dialogSelected'
import { DialogListProvider } from './_providers/dialogList'
import { getDialogsShortQuery } from './_query/dialogs'

interface MessengerProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function Messenger(props: MessengerProps) {
  const { params } = props
  const dialogs = await getDialogsShortQuery(['1', '2'])

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
