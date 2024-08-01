import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
  useRole,
  useTransitionStatus,
  useTransitionStyles,
} from '@floating-ui/react'
import React, { PropsWithChildren } from 'react'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface AnimationStyles {
  initial?: React.CSSProperties;
  open?: React.CSSProperties;
  close?: React.CSSProperties;
}

interface ModalProps extends PropsWithChildren {
  isOpen: boolean
  rootClassName?: string
  contentClassName?: string
  onClose?: VoidFunction
  showOverlay?: boolean
  duration?: number
  overlayAnimation?: AnimationStyles
  contentAnimation?: AnimationStyles
}

const defaultOverlayAnimation: AnimationStyles = {
  initial: { opacity: 0 },
  open: { opacity: 1 },
  close: { opacity: 0 },
}

const defaultContentAnimation: AnimationStyles = {
  initial: { opacity: 0, transform: 'scale(0.9)' },
  open: { opacity: 1, transform: 'scale(1)' },
  close: { opacity: 0, transform: 'scale(0.9)' },
}

export function Modal(props: ModalProps) {
  const {
    isOpen,
    onClose,
    children,
    showOverlay = true,
    duration = 300,
    overlayAnimation = defaultOverlayAnimation,
    contentAnimation = defaultContentAnimation,
    rootClassName,
    contentClassName,
  } = props

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: onClose,
  })

  const click = useClick(context)
  const role = useRole(context)
  const dismiss = useDismiss(context)

  const { getFloatingProps } = useInteractions([
    click,
    role,
    dismiss,
  ])

  const headingId = useId()

  const { isMounted } = useTransitionStatus(context, {
    duration,
  })

  const { styles: overlayStyles } = useTransitionStyles(context, {
    duration,
    ...overlayAnimation,
  })

  const { styles: contentStyles } = useTransitionStyles(context, {
    duration,
    ...contentAnimation,
  })

  if (!isMounted) return null

  const ModalContent = (
    <FloatingFocusManager context={context}>
      <div
        ref={refs.setFloating}
        aria-labelledby={headingId}
        {...getFloatingProps()}
        className={classNames(cn(), rootClassName)}
        style={contentStyles}
      >
        <div className={classNames(cn('Content'), contentClassName)}>
          {children}
        </div>
      </div>
    </FloatingFocusManager>
  )

  return (
    <FloatingPortal id="modals">
      {showOverlay ? (
        <FloatingOverlay
          lockScroll
          className={cn('Overlay')}
          onClick={onClose}
          style={overlayStyles}
        >
          {ModalContent}
        </FloatingOverlay>
      ) : ModalContent}
    </FloatingPortal>
  )
}
