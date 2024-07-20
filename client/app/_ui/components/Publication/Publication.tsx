'use client'

import { useRef } from 'react'
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
  /**
   * Нажатие правой кнопкой мыши
   * TODO потом сделать появление контекстного меню
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // предотвращаем появление стандартного контекстного меню
    handleSetChangeActive((prevState) => ({ isChangeActive: !prevState.isChangeActive }))
  }
  return (
    <div ref={publicationRef} className={classNames(cn(), className)} onContextMenu={handleContextMenu}>
      <div className={cn('Wrapper', { authorPosition, isChangeActive })}>
        {children}
      </div>
    </div>
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
