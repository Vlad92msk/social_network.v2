import {
  FloatingPortal,
  type Placement,
  type Strategy,
  useFloating,
  useTransitionStatus,
  useTransitionStyles,
} from '@floating-ui/react'
import { ReactNode, useMemo } from 'react'
import styles from './Notification.module.scss'

export interface NotificationProps {
  isOpen: boolean
  onClose: VoidFunction
  message: ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  position?: Placement
  strategy?: Strategy
  offset?: number
  index?: number
}

const SCREEN_PADDING = 50
const NOTIFICATION_GAP = 16
const NOTIFICATION_HEIGHT = 100

export function Notification(props: NotificationProps) {
  const {
    isOpen,
    onClose,
    message,
    type = 'info',
    position = 'bottom-end',
    strategy = 'fixed',
    offset: offsetDistance = SCREEN_PADDING,
    index = 0,
  } = props

  // Настраиваем floating context правильно
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose()
    },
  })

  const baseStyles = useMemo<React.CSSProperties>(() => ({
    position: strategy,
    zIndex: 1000 + index,
    ...(position.includes('bottom') && {
      bottom: offsetDistance + (index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP)),
    }),
    ...(position.includes('top') && {
      top: offsetDistance + (index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP)),
    }),
    ...(position.includes('end') && {
      right: offsetDistance,
    }),
    ...(position.includes('start') && {
      left: offsetDistance,
    }),
  }), [position, strategy, index, offsetDistance])

  // Используем статус для управления монтированием
  const { isMounted } = useTransitionStatus(context, {
    duration: 200,
  })

  // Настраиваем стили анимации
  const { styles: transitionStyles } = useTransitionStyles(context, {
    duration: 200,
    initial: {
      opacity: 0,
      transform: position.includes('end') ? 'translateX(100%)' : 'translateX(-100%)',
    },
    open: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    close: {
      opacity: 0,
      transform: position.includes('end') ? 'translateX(100%)' : 'translateX(-100%)',
    },
  })

  if (!isMounted) return null

  return (
    <FloatingPortal id="notifications">
      <div
        ref={refs.setFloating}
        style={{
          ...baseStyles,
          ...transitionStyles,
        }}
        className={styles.wrapper}
      >
        <div className={`${styles.notification} ${styles[`notification-${type}`]}`}>
          {message}
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </FloatingPortal>
  )
}
