import { useEffect, useState } from 'react'

interface PreviewData {
  title: string
  description: string
  image: string
  url: string
}

export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }

    const domain = url.hostname

    if (!domain.includes('.')) {
      return false
    }

    const tld = domain.split('.').pop()
    if (!tld || tld.length < 2) {
      return false
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-._]+[a-zA-Z0-9]$/
    if (!domainRegex.test(domain)) {
      return false
    }

    if (urlString.length > 2048) {
      return false
    }

    const commonTLDs = [
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'ru',
      'uk', 'de', 'fr', 'it', 'nl', 'eu', 'io', 'dev',
    ]
    return commonTLDs.some((commonTld) => domain.endsWith(`.${commonTld}`))
  } catch {
    return false
  }
}

interface UseLinkPreviewResult {
  previewData: PreviewData | null
  isLoading: boolean
}

export const useLinkPreview = (url: string): UseLinkPreviewResult => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchPreview = async () => {
      // Проверяем наличие и базовую валидность URL
      if (!url || !url.trim() || !isValidUrl(url.trim())) {
        setPreviewData(null)
        return
      }

      setIsLoading(true)

      try {
        const normalizedUrl = url.trim()
        const response = await fetch('http://localhost:3000/api/link-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: normalizedUrl }),
        })

        if (!isMounted) return

        if (!response.ok) {
          setPreviewData(null)
          return
        }

        const data = await response.json()

        if (!isMounted) return

        // Проверяем валидность полученных данных
        if (data && typeof data === 'object' && (data.title || data.description)) {
          setPreviewData({
            title: String(data.title || ''),
            description: String(data.description || ''),
            image: String(data.image || ''),
            url: normalizedUrl,
          })
        } else {
          setPreviewData(null)
        }
      } catch {
        if (isMounted) {
          setPreviewData(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPreview()

    return () => {
      isMounted = false
    }
  }, [url])

  return { previewData, isLoading }
}
