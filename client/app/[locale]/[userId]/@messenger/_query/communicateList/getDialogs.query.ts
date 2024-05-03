import { Dialog } from '@api/messenger/communicateList/types'
import { sleep } from '@utils/others/sleep'

export const getDialogsQuery = async (userId: string, dialogId: string): Promise<Dialog[]> => {
  await sleep(5000)

  try {
    const response = await fetch(`http://localhost:3000/api/messenger/communicateList/${userId}/dialogs/${dialogId}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch dialogs')

    return await response.json()
  } catch (error) {
    return []
  }
}
