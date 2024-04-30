import { Locales } from '@middlewares/location'
import { MessengerMain as MessengerComponent } from './_components'
import { getContactsQuery, getGroupsQuery } from './_query/communicateList'
import { CommunicateListProvider } from './providers/communicateList'

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
    <CommunicateListProvider contacts={contacts} groups={groups}>
      <MessengerComponent />
    </CommunicateListProvider>
  )
}
