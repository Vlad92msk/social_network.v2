import { useRef } from 'react'
import { useDeviceType } from './useDeviceType'
import { useRect, UseRectProps } from './useRect'

export interface UseScreenWidthProps {
  options?: UseRectProps['options']
}

export const useScreenWidth = (props: UseScreenWidthProps = {}) => {
  const { options } = props
  const bodyRef = useRef<HTMLElement>(document.body)

  const rect = useRect({ ref: bodyRef, watchProps: ['width'], options })
  const deviceType = useDeviceType()

  return {
    screenWidth: rect.width,
    deviceType,
  }
}
