import { Locales } from '@middlewares/location'
import { Chat, Communicate } from './_components'
import { Messenger as MessengerModule } from './_components/Messenger'
import { ChatProvider } from './_providers/chat'
import { CommunicateListProvider } from './_providers/communicateList'
import { getContactsQuery, getGroupsQuery } from './_query/communicateList'

interface MessengerProps {
  params: {
    locale: Locales
    userId: string
  }
  searchParams: {}
}

export default async function Messenger(props: MessengerProps) {
  const { params } = props
  const contacts = await getContactsQuery(params.userId)
  const groups = await getGroupsQuery(params.userId)

  return (
    <MessengerModule
      communicate={(
        <CommunicateListProvider contacts={contacts} groups={groups}>
          <Communicate />
        </CommunicateListProvider>
    )}
      chat={(
        <ChatProvider>
          <Chat />
        </ChatProvider>
      )}
    />
  )
}
