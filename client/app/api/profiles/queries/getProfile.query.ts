import { ProfileType } from '@api/profiles/types/profile.type'

export const getProfileQuery = async (profileId: string): Promise<ProfileType | undefined> => {
  // await sleep(2000)

  try {
    const response = await fetch(`http://localhost:3000/api/profiles/${profileId}`, {
      method: 'GET',
    })

    if (!response.ok) throw new Error('Failed to fetch [...allRoutes]')

    return await response.json()
  } catch (error) {
    console.log(error)
    // return undefined
  }
}
