import { MediaStreamProvider } from '@ui/components/media-stream/context/MediaStreamContext'
import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import { WebRTCProvider } from './_services/ConferenceContext'

export default async function ConferencePage() {
  const profile = await getServerProfile()

  return (
    <MediaStreamProvider>
      <WebRTCProvider>
        <Conference profile={profile} />
      </WebRTCProvider>
    </MediaStreamProvider>
  )
}
