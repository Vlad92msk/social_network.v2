import { UserSettings } from '@api/settings/[userId]/route'

export const getSettings = async (id: string): Promise<UserSettings> => {
  try {
    const response = await fetch(`http://localhost:3000/api/settings/${id}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch settings')

    return await response.json()
  } catch (error) {
    return { layoutVariant: '222' }
  }
}
