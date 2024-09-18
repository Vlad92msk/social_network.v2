import { auth } from '../../../auth'
import { profileApiInstance } from '../../../store/instance'

export const getServerProfile = async () => {
  const session = await auth()
  const profile = session?.user?.email
    ? await profileApiInstance.getProfileInfo({ body: { email: session.user.email } })
    : undefined

  return profile
}
