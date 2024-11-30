import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import { ConferenceProvider } from './web-rtc/context'

export default async function ConferencePage({ params }) {
  const profile = await getServerProfile()

  const userId = profile?.user_info.id || 0
  if (!userId) return null
  return (
      // <ConferenceProvider currentUserId={String(userId)} dialogId={params.dialogId}>
        <Conference profile={profile} />
      // </ConferenceProvider>
  )
}
