import { Contact } from '@api/messenger/communicateList/types'

export const getContactsQuery = async (id: string): Promise<Contact[]> => {
  try {
    const response = await fetch(`http://localhost:3000/api/messenger/communicateList/${id}/contacts`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch settings')

    return await response.json()
  } catch (error) {
    return []
  }
}
