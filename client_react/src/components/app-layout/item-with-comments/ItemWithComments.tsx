import { cloneElement, JSX, useState } from 'react'
import { MediaItemElement } from '@components/app-layout/media-item-element'
import { Button, Icon, Modal } from '@components/ui'
import { useBooleanState } from '@hooks'
import { classNames, makeCn } from '@utils'

import { MediaResponseDto } from '../../../../../swagger/media/interfaces-media'
import style from './ItemWithComments.module.scss'

export const cn = makeCn('ItemWithComments', style)

interface ItemWithCommentsProps {
  className?: string
  item?: MediaResponseDto
  // target: CommentsProps['target']
  target: any
  children: JSX.Element
}

export function ItemWithComments(props: ItemWithCommentsProps) {
  const { item, className, children, target, ...rest } = props
  const [isOpen, onOpen, onClose] = useBooleanState(false)
  const [isHideComments, onOpenComments] = useState(false)

  if (isOpen) {
    console.log('item', item)
  }
  return (
    <>
      {cloneElement(children, {
        ...rest,
        onClick: (event: any) => {
          event.preventDefault()
          event.stopPropagation()
          onOpen()
        },
      })}
      {item && (
        <Modal contentClassName={classNames(cn(), className)} isOpen={isOpen} showOverlay onClose={onClose}>
          <div className={cn('ContentContainer')}>
            <div className={cn('ContentItem')}>
              <MediaItemElement mediaInfoId={item?.id} type={item?.meta.type} metadata={item?.meta} />
            </div>
            <div />
            <div className={cn('MetaInfo')}>
              {/* <ToggleReactions entity_type="media" entity_id={item.id} reactions={item.reaction_info} /> */}
              <Button onClick={() => onOpenComments((prev) => !prev)}>
                <Icon name="chat" />
                {item.comments_count}
              </Button>
            </div>
          </div>
          <div className={cn('CommentsContainer', { hide: isHideComments })}>
            <div className={cn('CommentsActions')}>
              <Button onClick={onClose}>
                <Icon name="close" />
              </Button>
            </div>
            {/* <ModuleComments */}
            {/*   className={cn('CommentsContent')} */}
            {/*   id={item.id} */}
            {/*   target={target} */}
            {/* /> */}
          </div>
        </Modal>
      )}
    </>
  )
}
