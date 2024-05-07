import { Dialog } from '@api/messenger/communicateList/types'
import { sleep } from '@utils/others/sleep'

export const getDialogsQuery = async (dialogIds: string[]): Promise<Dialog[]> => {
  await sleep(2000)

  try {
    const response = await fetch(`http://localhost:3000/api/messenger/dialogs?dialogIds=${dialogIds}`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch queries')

    return await response.json()
  } catch (error) {
    return []
  }
}


export const getDialogsShortQuery = async (dialogIds?: string[]): Promise<Dialog[]> => {
  // await sleep(2000)

  if (!dialogIds) return []

  try {
    const response = await fetch(`http://localhost:3000/api/messenger/dialogs?dialogIds=${dialogIds}&isShorts=true`, {
      method: 'GET',
      cache: 'no-cache',
    })

    if (!response.ok) throw new Error('Failed to fetch queries')

    return await response.json()
  } catch (error) {
    return []
  }
}
