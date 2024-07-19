'use client'

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

type PublicationEmojis = any[]

/**
 * То что можно передать в контекст Компонента
 */
interface PublicationContextState {
  isChangeActive?: boolean
  dateChanged?: Date
  dateCreated?: Date
}

// Поля, которые могут быть отредактированы
export interface PublicationContextChangeState {
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
  dateCreated: undefined,
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
}

function BasePublication(props: PublicationProps) {
  const { className, authorPosition = 'right', children } = props
  const isChangeActive = usePublicationCtxSelect((store) => store.isChangeActive)

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
