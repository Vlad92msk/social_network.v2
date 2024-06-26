import { classNames } from '@utils/others'
import { cn } from './cn'
import {
  Author, ChangeContainer, Commets, DateCreated, DateDelivery, Emojies, MediaContainer, Text,
} from './elements'

interface PublicationComponents {
  Author?: typeof Author;
  ChangeContainer?: typeof ChangeContainer;
  MediaContainer?: typeof MediaContainer;
  Text?: typeof Text;
  Emojies?: typeof Emojies;
  Commets?: typeof Commets;
  DateDelivery?: typeof DateDelivery;
  DateCreated?: typeof DateCreated;
}

export interface PublicationProps extends PublicationComponents {
  className?: string
  children?: React.ReactNode[]
}

export function Publication(props: PublicationProps) {
  const { className, children } = props

  return (
    <div className={classNames(cn(), className)}>
      {children}
    </div>
  )
}

Publication.Author = Author
Publication.ChangeContainer = ChangeContainer
Publication.MediaContainer = MediaContainer
Publication.Text = Text
Publication.Emojies = Emojies
Publication.Commets = Commets
Publication.DateDelivery = DateDelivery
Publication.DateCreated = DateCreated
