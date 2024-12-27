import { Conference, ConferenceProvider } from '@ui/modules/conference'
import { getServerProfile } from '@utils/server'

export default async function ConferencePage(props) {
  const params = await props.params;
  const profile = await getServerProfile()

  const userId = profile?.user_info.id || 0
  if (!userId) return null
  return (
      <ConferenceProvider currentUserId={String(userId)} dialogId={params.dialogId}>
        <Conference />
      </ConferenceProvider>
  )
}
