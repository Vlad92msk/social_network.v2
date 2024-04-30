import { Group } from '@api/messenger/communicateList/types'

export const getGroupsQuery = async (id: string): Promise<Group[]> => {
  try {
    const response = await fetch(`http://localhost:3000/api/messenger/communicateList/${id}/groups`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch settings')

    return await response.json()
  } catch (error) {
    return []
  }
}
