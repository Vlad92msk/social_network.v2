import { Contact } from '@api/messenger/communicateList/types'
import { sleep } from '@utils/others/sleep'

export const getContactsQuery = async (id: string): Promise<Contact[]> => {
  // await sleep(5000)

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
