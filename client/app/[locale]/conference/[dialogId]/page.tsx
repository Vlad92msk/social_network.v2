import { getServerProfile } from '@utils/server'
import { Conference } from './_components'
import { WebRTCProvider } from './_context/WebRTCContext'

export default async function ConferencePage() {
  const profile = await getServerProfile()

  return (
    <WebRTCProvider>
      <Conference profile={profile} />
    </WebRTCProvider>
  )
}
