import { useEffect, useRef, useState } from 'react'

const getDeviceType = () => {
  const ua = navigator.userAgent

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState(getDeviceType())
  const resizeObserverRef = useRef<ResizeObserver>(null)

  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver(() => {
      setDeviceType(getDeviceType())
    })

    resizeObserverRef.current.observe(document.body)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [])

  return deviceType
}
