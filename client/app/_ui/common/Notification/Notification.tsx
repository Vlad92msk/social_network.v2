import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
  type VirtualElement,
  type Strategy
} from '@floating-ui/react'
import { ReactNode, useEffect, useRef } from 'react'

export interface NotificationProps {
  isOpen: boolean
  onClose: VoidFunction
  message: ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  position?: Placement
  strategy?: Strategy
  offset?: number
  index?: number // Добавляем index
}

export function Notification({
  isOpen,
  onClose,
  message,
  type = 'info',
  duration = 5000,
  position = 'bottom-end',
  strategy = 'fixed',
  offset: offsetDistance = 16,
  index = 0, // По умолчанию 0
}: NotificationProps) {
  const virtualRef = useRef<VirtualElement>({
    getBoundingClientRect: () => {
      const x = position.includes('end') ? window.innerWidth - 16 : 16
      const y = position.includes('bottom') ? window.innerHeight - 16 : 16

      return {
        x,
        y,
        top: y,
        bottom: y,
        left: x,
        right: x,
        width: 0,
        height: 0,
      }
    },
  })

  const {
    refs,
    floatingStyles,
    update,
  } = useFloating({
    elements: {
      //@ts-ignore
      reference: virtualRef.current,
    },
    placement: position,
    strategy,
    middleware: [
      // Добавляем базовый отступ + отступ на основе индекса
      offset(() => ({
        mainAxis: offsetDistance + (position.includes('bottom') ? -index * 100 : index * 100),
        crossAxis: 0,
      })),
      flip({
        fallbackAxisSideDirection: 'end',
      }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    if (isOpen) {
      const handleResize = () => update()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, update])

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles}>
        <div className={`notification notification-${type}`}>
          {message}
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </FloatingPortal>
  )
}
