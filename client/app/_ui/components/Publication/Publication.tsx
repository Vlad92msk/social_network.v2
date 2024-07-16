'use client'

import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Comments, DateCreated, DateRead, Emojies, MediaContainer, Text,
} from './elements'

interface PublicationComponents {
  Author?: typeof Author;
  ChangeContainer?: typeof ChangeContainer;
  MediaContainer?: typeof MediaContainer;
  Text?: typeof Text;
  Emojies?: typeof Emojies;
  Commets?: typeof Comments;
  DateRead?: typeof DateRead;
  DateCreated?: typeof DateCreated;
}

export interface PublicationProps extends PublicationComponents {
  className?: string
  children?: React.ReactNode[]
  authorPosition?: 'left' | 'right'
}

export function Publication(props: PublicationProps) {
  const { className, authorPosition = 'right', children } = props

  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('Wrapper', { authorPosition })}>
        {children}
      </div>
    </div>
  )
}

Publication.Author = Author
Publication.ChangeContainer = ChangeContainer
Publication.MediaContainer = MediaContainer
Publication.Text = Text
Publication.Emojies = Emojies
Publication.Commets = Comments
Publication.DateRead = DateRead
Publication.DateCreated = DateCreated
