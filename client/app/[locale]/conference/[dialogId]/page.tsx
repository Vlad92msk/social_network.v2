import { MediaStreamProvider } from '@ui/components/media-stream/MediaStream'
import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import { WebRTCProvider } from './_services/ConferenceContext'

export default async function ConferencePage() {
  const profile = await getServerProfile()

  const userId = profile?.user_info.id || 0
  if (!userId) return null
  return (
    <MediaStreamProvider>
      <WebRTCProvider>
        <Conference profile={profile} />
      </WebRTCProvider>
    </MediaStreamProvider>
  )
}
