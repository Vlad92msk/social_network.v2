import { MediaStreamProvider } from '@ui/components/media-stream/context/MediaStreamContext'
import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import { WebRTCProvider } from './_services/ConferenceContext'
import { ConferenceProvider } from './_webRTC1/context'

export default async function ConferencePage({ params }) {
  const profile = await getServerProfile()

  const userId = profile?.user_info.id || 0
  if (!userId) return null
  return (
      <ConferenceProvider currentUserId={String(userId)} dialogId={params.dialogId}>
        <Conference profile={profile} />
      </ConferenceProvider>
  )
}
