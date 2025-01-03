'use client'

import { useRef } from 'react'
import { Icon } from '@ui/common/Icon'
import { createStoreContext } from '@utils/client'
import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Comments, DateCreated, DateRead, Emojies, MediaContainer, Response, Text,
} from './elements'
import { useUpdateDateRead } from './hooks'
import { MediaEntity } from '../../../../../swagger/posts/interfaces-posts'
import { CalculateReactionsResponse } from '../../../../../swagger/reactions/interfaces-reactions'

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

/**
 * То что можно передать в контекст Компонента
 */
interface PublicationContextState {
  id: string
  isChangeActive?: boolean
  dateChanged?: Date
  reactions?: CalculateReactionsResponse
}

export interface MediaObject {
  audio: string[]
  video: string[]
  image: string[]
  other: string[]
  voices: string[]
}

// Поля, которые могут быть отредактированы
export interface PublicationContextChangeState {
  id: string
  media: Record<string, MediaEntity[]>
  text?: string
  removeMediaIds: MediaObject
  reactions?: Partial<CalculateReactionsResponse>
}

/**
 * Приватные поля (используются для редактирования состояния)
 */
interface PublicationContextPrivateState {
  status?: 'view' | 'reset' | 'approve'
  changeState: PublicationContextChangeState
  s: {
    reset?: VoidFunction
  }
}

const initialState: PublicationContextState & PublicationContextPrivateState = {
  id: '',
  isChangeActive: false,
  dateChanged: undefined,
  status: 'view',
  s: {
    reset: () => {},
  },
  changeState: {
    id: '',
    media: {},
    reactions: {
      my_reaction: undefined,
    },
    removeMediaIds: {
      audio: [],
      video: [],
      image: [],
      other: [],
      voices: [],
    },
  },
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
  classNameChangeOptions?: string
  children?: React.ReactNode[]
  authorPosition?: 'left' | 'right'
  onRead?: (publicationId?: string) => void
  dateRead?: Date
}

function BasePublication(props: PublicationProps) {
  const { className, authorPosition = 'right', children, onRead, dateRead, classNameChangeOptions } = props
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
    <div ref={publicationRef} className={classNames(cn({ isChangeActive }), className)}>
      <button
        className={classNames(cn('ChangeOptions'), classNameChangeOptions)}
        onClick={() => {
          handleSetChangeActive((ctx) => ({ isChangeActive: !ctx.isChangeActive }))
        }}
      >
        <Icon name="edit" />
      </button>
      <div className={cn('Wrapper', {
        authorPosition,
        isChangeActive,
      })}
      >
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
