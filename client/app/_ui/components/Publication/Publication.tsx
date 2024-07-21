'use client'

import { useRef } from 'react'
import { Button } from '@ui/common/Button'
import { Popover, PopoverContent } from '@ui/common/Popover'
import { Text as TextComponent } from '@ui/common/Text'
import { createStoreContext } from '@utils/client'
import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Comments, DateCreated, DateRead, Emojies, MediaContainer, Response, Text,
} from './elements'
import { useUpdateDateRead } from './hooks'

interface PublicationComponents {
  Author?: typeof Author
  ChangeContainer?: typeof ChangeContainer
  MediaContainer?: typeof MediaContainer
  Text?: typeof Text
  Emojies?: typeof Emojies
  Commets?: typeof Comments
  DateRead?: typeof DateRead
  DateCreated?: typeof DateCreated
  Response?: typeof Response
}

type PublicationEmojis = any[]

/**
 * То что можно передать в контекст Компонента
 */
interface PublicationContextState {
  id?: string
  isChangeActive?: boolean
  dateChanged?: Date
}

// Поля, которые могут быть отредактированы
export interface PublicationContextChangeState {
  id?: string
  media?: any
  text?: string
  emojis?: PublicationEmojis
}

/**
 * Приватные поля (используются для редактирования состояния)
 */
interface PublicationContextPrivateState {
  status?: 'view' | 'reset' | 'approve'
  changeState?: PublicationContextChangeState
}

const initialState: PublicationContextState & PublicationContextPrivateState = {
  isChangeActive: false,
  dateChanged: undefined,
  status: 'view',
}

export const {
  contextWrapper,
  useStoreSelector: usePublicationCtxSelect,
  useStoreDispatch: usePublicationCtxUpdate,
} = createStoreContext({
  initialState,
})

export interface PublicationProps extends PublicationComponents {
  className?: string
  children?: React.ReactNode[]
  authorPosition?: 'left' | 'right'
  onRead?: (publicationId?: string) => void
  dateRead?: Date
}

function BasePublication(props: PublicationProps) {
  const { className, authorPosition = 'right', children, onRead, dateRead } = props
  const isChangeActive = usePublicationCtxSelect((store) => store.isChangeActive)
  const handleSetChangeActive = usePublicationCtxUpdate()

  const publicationRef = useRef<HTMLDivElement>(null)

  /**
   * Обновляем дату прочтения если ее нет
   */
  useUpdateDateRead({
    ref: publicationRef,
    onRead,
    dateRead,
  })

  return (
    <Popover
      content={(
        <PopoverContent>
          <Button
            onClick={() => {
              handleSetChangeActive((ctx) => ({ isChangeActive: !ctx.isChangeActive }))
            }}
          >
            <TextComponent fs="12">Редактировать</TextComponent>
          </Button>
        </PopoverContent>
    )}
      trigger="contextMenu"
      strategy="absolute"
      offset={0}
    >
      <div ref={publicationRef} className={classNames(cn(), className)}>
        <div className={cn('Wrapper', {
          authorPosition,
          isChangeActive,
        })}
        >
          {children}
        </div>
      </div>
    </Popover>
  )
}

BasePublication.Author = Author
BasePublication.ChangeContainer = ChangeContainer
BasePublication.MediaContainer = MediaContainer
BasePublication.Text = Text
BasePublication.Emojies = Emojies
BasePublication.Commets = Comments
BasePublication.DateRead = DateRead
BasePublication.DateCreated = DateCreated
BasePublication.Response = Response

export const Publication = Object.assign(
  contextWrapper<PublicationProps, PublicationContextState>(BasePublication),
  BasePublication,
)
