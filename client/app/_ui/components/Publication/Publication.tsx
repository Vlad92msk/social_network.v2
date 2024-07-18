'use client'

import { useEffect } from 'react'
import { createStoreContext } from '@utils/client'
import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Comments, DateCreated, DateRead, Emojies, MediaContainer, Text,
} from './elements'

interface PublicationComponents {
  Author?: typeof Author
  ChangeContainer?: typeof ChangeContainer
  MediaContainer?: typeof MediaContainer
  Text?: typeof Text
  Emojies?: typeof Emojies
  Commets?: typeof Comments
  DateRead?: typeof DateRead
  DateCreated?: typeof DateCreated
}

interface PublicationMedia {
  image: []
  audio: []
  video: []
  text: []
  other: []
}

type PublicationEmojis = any[]

/**
 * То что можно передать в контекст Компонента
 */
interface PublicationContextState {
  isChangeActive?: boolean
  text?: string
  media?: PublicationMedia
  emojis?: PublicationEmojis
  dateChanged?: Date
  dateCreated?: Date
}

/**
 * Приватные поля (используются для редактирования состояния)
 */
interface PublicationContextPrivateState {
  changeState?: PublicationContextState
}

const initialState: PublicationContextState & PublicationContextPrivateState = {
  isChangeActive: false,
  text: undefined,
  media: undefined,
  emojis: undefined,
  dateChanged: undefined,
  dateCreated: undefined,
  changeState: undefined,
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
}

function BasePublication(props: PublicationProps) {
  const { className, authorPosition = 'right', children } = props
  const isChangeActive = usePublicationCtxSelect((store) => store.isChangeActive)
  const updateState = usePublicationCtxUpdate()

  useEffect(() => {
    // Сохраняем все переданные параметры отдельно, чтобы их редактировать и иметь возможность отменить изменения
    updateState(({ changeState, ...cxt }) => ({ changeState: cxt }))
  }, [updateState])

  return (
    <div className={classNames(cn(), className)}>
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

export const Publication = Object.assign(
  contextWrapper<PublicationProps, PublicationContextState>(BasePublication),
  BasePublication,
)
