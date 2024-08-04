import { useBooleanState } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Modal } from '@ui/common/Modal'
import { Text } from '@ui/common/Text'
import { CommentsProps, ModuleComments } from '@ui/modules/comments'
import { classNames } from '@utils/others'
import React, { JSX } from 'react'
import { makeCn } from '../../../_utils/others'
import style from './ItemWithComments.module.scss'

export const cn = makeCn('ItemWithComments', style)


interface ItemWithCommentsProps {
  className?: string
  item?: any
  module: CommentsProps['module']
  children: JSX.Element
}

export const ItemWithComments = (props: ItemWithCommentsProps) => {
  const { item, className, children, module, ...rest } = props
  const [isOpen, onOpen, onClose] = useBooleanState(false)

  return (
    <>
      {React.cloneElement(children, {
        ...rest,
        onClick: onOpen,
      })}
      <Modal contentClassName={classNames(cn(), className)} isOpen={isOpen} showOverlay>
        <div className={cn('ContentContainer')}>
          <div className={cn('ContentItem')}>{item?.name}</div>
          <div className={cn('MetaInfo')}>
            <Text>1</Text>
            <Text>1</Text>
            <Text>1</Text>
            <Text>1</Text>
          </div>
        </div>
        <div className={cn('CommentsContainer')}>
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
