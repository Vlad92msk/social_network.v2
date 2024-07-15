import { classNames } from '@utils/others'
import React, { PropsWithChildren, ReactElement } from 'react'
import { cn } from '@ui/base/Modal/cn'
import { Portal } from '@ui/base/Portal'
import { ModalCloseButton } from './ModalCloseButton'
import { ModalOverlay } from './ModalOverlayProps'

interface ReduceResult {
  overlay: ReactElement | null;
  closeButton: ReactElement | null;
  content: React.ReactNode[];
}

interface ModalProps {
  isOpen: boolean;
  rootClassName?: string
  contentClassName?: string
}

export function ModalBase(props: PropsWithChildren<ModalProps>) {
  const { isOpen, children, rootClassName, contentClassName } = props

  if (!isOpen) return null

  const { overlay, closeButton, content } = React.Children.toArray(children).reduce<ReduceResult>(
    (result, child) => {
      if (React.isValidElement(child)) {
        switch (child.type) {
          case ModalOverlay: {
            result.overlay = child
            break
          }
          case ModalCloseButton: {
            result.closeButton = child
            break
          }
          default: {
            result.content.push(child)
          }
        }
      } else {
        result.content.push(child)
      }
      return result
    },
    { overlay: null, closeButton: null, content: [] },
  )
  return (
    <Portal open={isOpen}>
      <div className={classNames(cn(), rootClassName)}>
        {overlay}
        <div className={classNames(cn('Content'), contentClassName)} onClick={(e) => e.stopPropagation()}>
          {closeButton}
          {content}
        </div>
      </div>
    </Portal>
  )
}
