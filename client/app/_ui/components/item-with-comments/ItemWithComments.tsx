import React, { JSX, useState } from 'react'
import { useBooleanState } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Modal } from '@ui/common/Modal'
import { Text } from '@ui/common/Text'
import { CommentsProps, ModuleComments } from '@ui/modules/comments'
import { classNames, makeCn } from '@utils/others'
import style from './ItemWithComments.module.scss'

export const cn = makeCn('ItemWithComments', style)

interface ItemWithCommentsProps {
  className?: string
  item?: any
  module: CommentsProps['module']
  children: JSX.Element
}

export function ItemWithComments(props: ItemWithCommentsProps) {
  const { item, className, children, module, ...rest } = props
  const [isOpen, onOpen, onClose] = useBooleanState(false)
  const [isHideComments, onOpenComments] = useState(false)

  return (
    <>
      {React.cloneElement(children, {
        ...rest,
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpen()
        },
      })}
      <Modal contentClassName={classNames(cn(), className)} isOpen={isOpen} showOverlay onClose={onClose}>
        <div className={cn('ContentContainer')}>
          <div className={cn('ContentItem')}>{item?.name}</div>
          <div className={cn('MetaInfo')}>
            <Button>
              <Icon name="thump-up" />
            </Button>
            <Button >
              <Icon name="thumb-down" />
            </Button>
            <Button onClick={() => onOpenComments(prev => !prev)}>
              <Icon name={'chat'} />
            </Button>
          </div>
        </div>
        <div className={cn('CommentsContainer', { hide: isHideComments })}>
          <div className={cn('CommentsActions')}>
            <Button onClick={onClose}>
              <Icon name="close" />
            </Button>
          </div>
          <ModuleComments
            className={cn('CommentsContent')}
            id={item?.id}
            module={module}
          />
        </div>
      </Modal>
    </>
  )
}
