import { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  open?: boolean;
  container?: Element | DocumentFragment;
}

export function Portal(props: PropsWithChildren<PortalProps>) {
  const { open = false, container, children } = props

  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!open) return <></>
  const mountNode = container ?? document.getElementById('modals')

  if (!mountNode) {
    console.warn('Портал: Отсутствует компонент в который монтируется портал')
    return null
  }

  return createPortal(<>{children}</>, mountNode)
}
