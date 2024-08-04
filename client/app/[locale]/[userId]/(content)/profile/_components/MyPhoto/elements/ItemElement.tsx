import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { CSSProperties } from 'react'
import { useBooleanState } from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Modal } from '@ui/common/Modal'
import { Text } from '@ui/common/Text'
import { ModuleComments } from '@ui/modules/comments'
import { cn } from '../cn'

interface ElementProps {
  isHighlighted?: boolean
  isPlaceholder?: boolean
  isDraging?: boolean
  style?: CSSProperties
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
  ref?: any
  item?: any
}

export function ItemElement(props: ElementProps) {
  const {
    isDraging, isPlaceholder, isHighlighted, listeners, attributes, item, ...rest
  } = props
  const [isOpen, onOpen, onClose] = useBooleanState(false)

  return (
    <div
      className={
        cn('PhotoItem', {
          highlighted: isHighlighted,
          placeholder: isPlaceholder,
          dragging: isDraging,
        })
      }
      {...listeners}
      {...attributes}
      {...rest}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        onOpen()
      }}
    >
      {item?.name}
      <Modal contentClassName={cn('ModalSelectedItem')} isOpen={isOpen} showOverlay>
        <div className={cn('ModalSelectedItemContentContainer')}>
          <div className={cn('ModalSelectedItemContentItem')}>{item?.name}</div>
          <div className={cn('ModalSelectedItemMetaInfo')}>
            <Text>1</Text>
            <Text>1</Text>
            <Text>1</Text>
            <Text>1</Text>
          </div>
        </div>
        <div className={cn('ModalSelectedItemCommentsContainer')}>
          <div className={cn('ModalSelectedItemCommentsActions')}>
            <Button onClick={onClose}>
              <Icon name="close" />
            </Button>
          </div>
          <ModuleComments
            className={cn('ModalSelectedItemCommentsContent')}
            id={item?.id}
            module="photo"
          />
        </div>
      </Modal>
    </div>
  )
}
