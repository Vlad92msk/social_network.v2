import { cloneElement, JSX, useState } from 'react'
import { useBooleanState } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import { Modal } from '@ui/common/Modal'
import { CommentsProps, ModuleComments } from '@ui/modules/comments'
import { ToggleReactions } from '@ui/modules/toggle-reactions'
import { classNames, makeCn } from '@utils/others'
import style from './ItemWithComments.module.scss'
import { MediaResponseDto } from '../../../../../swagger/media/interfaces-media'

export const cn = makeCn('ItemWithComments', style)

interface ItemWithCommentsProps {
  className?: string
  item?: MediaResponseDto
  target: CommentsProps['target']
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
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpen()
        },
      })}
      {
      item && (
        <Modal contentClassName={classNames(cn(), className)} isOpen={isOpen} showOverlay onClose={onClose}>
          <div className={cn('ContentContainer')}>
            <div className={cn('ContentItem')}>
              <Image
                src={item?.meta.src}
                alt={item?.meta.name}
                width={400}
                height={400}
              />
            </div>
            <div />
            <div className={cn('MetaInfo')}>
              <ToggleReactions entity_type="media" entity_id={item.id} reactions={item.reaction_info} />
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
            <ModuleComments
              className={cn('CommentsContent')}
              id={item.id}
              target={target}
            />
          </div>
        </Modal>
      )
    }
    </>
  )
}
