import { useEffect, useState } from 'react'

export function useNetworkInfo() {
  const [networkType, setNetworkType] = useState<string>()

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (connection) {
      setNetworkType(connection.effectiveType)
    }
  }, [])

  return networkType
}
