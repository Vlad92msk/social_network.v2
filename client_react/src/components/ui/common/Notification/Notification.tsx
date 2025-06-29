import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { FloatingPortal, type Placement, type Strategy, useFloating, useTransitionStatus, useTransitionStyles } from '@floating-ui/react'

import { Button } from '../Button'
import { Icon } from '../icon'
import styles from './Notification.module.scss'

export interface NotificationProps {
  containerId?: string
  isOpen: boolean
  onClose: VoidFunction
  message: ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  position?: Placement
  strategy?: Strategy
  offset?: number
  index?: number
  autoClose?: boolean
}

const SCREEN_PADDING = 20
const NOTIFICATION_GAP = 10
const NOTIFICATION_HEIGHT = 62

// Иконки для разных типов уведомлений
function NotificationIcon({ type }: { type: string }) {
  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  }

  return <div className={styles.icon}>{icons[type as keyof typeof icons]}</div>
}

export function Notification(props: NotificationProps) {
  const {
    containerId = 'notifications',
    isOpen,
    onClose,
    message,
    type = 'info',
    duration = 5000,
    position = 'bottom-end',
    strategy = 'fixed',
    offset: offsetDistance = SCREEN_PADDING,
    index = 0,
    autoClose = true,
  } = props

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Управляем автозакрытием
  useEffect(() => {
    if (isOpen && autoClose && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose()
      }, duration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isOpen, autoClose, duration, onClose])

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose()
    },
  })

  const baseStyles = useMemo<React.CSSProperties>(
    () => ({
      position: strategy,
      zIndex: 1000 + index,
      ...(position.includes('bottom') && {
        bottom: offsetDistance + index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP),
      }),
      ...(position.includes('top') && {
        top: offsetDistance + index * (NOTIFICATION_HEIGHT + NOTIFICATION_GAP),
      }),
      ...(position.includes('end') && {
        right: offsetDistance,
      }),
      ...(position.includes('start') && {
        left: offsetDistance,
      }),
      ...(position.includes('center') && {
        left: '50%',
        transform: 'translateX(-50%)',
      }),
    }),
    [position, strategy, index, offsetDistance],
  )

  // Используем статус для управления монтированием
  const { isMounted } = useTransitionStatus(context, {
    duration: 400,
  })

  // Улучшенные стили анимации
  const { styles: transitionStyles } = useTransitionStyles(context, {
    duration: 400,
    initial: {
      opacity: 0,
      transform: position.includes('end') ? 'translateX(100%) scale(0.95)' : position.includes('start') ? 'translateX(-100%) scale(0.95)' : 'translateY(100%) scale(0.95)',
    },
    open: {
      opacity: 1,
      transform: 'translateX(0) translateY(0) scale(1)',
    },
    close: {
      opacity: 0,
      transform: position.includes('end') ? 'translateX(100%) scale(0.95)' : position.includes('start') ? 'translateX(-100%) scale(0.95)' : 'translateY(-20%) scale(0.95)',
    },
  })

  // Обработчик клика с очисткой таймера
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    onClose()
  }

  // Обработчик наведения мыши - приостанавливаем таймер
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Обработчик ухода мыши - возобновляем таймер
  const handleMouseLeave = () => {
    if (autoClose && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose()
      }, 1000) // Даем еще секунду после ухода мыши
    }
  }

  if (!isMounted) return null

  return (
    <FloatingPortal id={containerId}>
      <div
        ref={refs.setFloating}
        style={{
          ...baseStyles,
          ...transitionStyles,
        }}
        className={styles.wrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`${styles.notification} ${styles[`notification-${type}`]}`}>
          <NotificationIcon type={type} />

          <div className={styles.content}>
            <div className={styles.message}>{message}</div>
          </div>

          <Button onClick={handleClose} className={styles.closeButton} aria-label="Close notification">
            <Icon name="close" />
          </Button>
        </div>
      </div>
    </FloatingPortal>
  )
}
