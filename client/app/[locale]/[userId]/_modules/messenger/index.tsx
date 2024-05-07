import { sleep } from '@utils/others/sleep'
import { getServerSession } from 'next-auth'
import { Locales } from '@middlewares/location'
import { getProfileQuery } from '../../../../_query'
import { DialogsDrawerBar, DialogSelected } from './_components'
import { Messenger as MessengerModule } from './_components/Messenger'
import { DialogListProvider } from './_providers/dialogList'
import { DialogSelectedProvider } from './_providers/dialogSelected'
import { getDialogsShortQuery } from './_query/dialogs'

interface MessengerProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export async function Messenger(props: MessengerProps) {
  const { params } = props
  // await sleep(1000)
  const serverSession = await getServerSession()
  const profile = await getProfileQuery(serverSession?.user?.email as string)
  const dialogs = await getDialogsShortQuery(profile?.dialogs)


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
