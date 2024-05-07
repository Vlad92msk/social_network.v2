import { ProfileType } from '@api/profiles/types/profile.type'

export const getUsersProfilesQuery = async (userIds?: string[]): Promise<ProfileType | undefined> => {
  // await sleep(2000)

  try {
    const response = await fetch(`http://localhost:3000/api/users?userIds=${userIds}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch users')

    return await response.json()
  } catch (error) {
    console.log(error)
    // return undefined
  }
}
