import { useState } from 'react'

type HandleDownloadFile = (url: string, filename: string) => Promise<void>

export const useHandleDownloadFile = (): [HandleDownloadFile, boolean] => {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (url: string, filename: string) => {
    setDownloading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
    setDownloading(false)
  }

  return [handleDownload, downloading]
}
