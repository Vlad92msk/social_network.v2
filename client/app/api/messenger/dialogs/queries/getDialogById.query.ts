import { DialogResponse } from '@api/messenger/communicateList/types'
import { sleep } from '@utils/others/sleep'

export const getDialogByIDQuery = async (dialogId: string): Promise<DialogResponse> => {
  // await sleep(2000)

  try {
    const response = await fetch(`http://localhost:3000/api/messenger/dialogs/${dialogId}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch queries')

    return await response.json()
  } catch (error) {
    throw new Error('Failed to fetch queries')
  }
}
