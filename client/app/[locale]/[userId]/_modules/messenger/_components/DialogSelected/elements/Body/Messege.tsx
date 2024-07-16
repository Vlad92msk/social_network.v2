import { addDays } from 'date-fns'
import { useEffect, useState } from 'react'
import { Message as UserMessage } from '@api/messenger/dialogs/types/message.type'
import { useProfile } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { Media111 } from '@ui/components/Publication/elements'
import { cn } from './cn'
import { generateText } from '../../../../../../(content)/profile/_components/data'

interface MessageProps {
  message: UserMessage
}

export function Message(props: MessageProps) {
  const { message } = props
  const { id, author } = message

  const { profile } = useProfile()
  const [media, setMedia] = useState<Media111>()

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media')
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setMedia(data)
      } catch (error) {
        console.error('Error fetching media:', error)
      }
    }

    fetchMedia()
  }, [])

  const from = profile?.userInfo.id === author?.id ? 'me' : 'other'

  return (
    <div
      id={id}
      className={cn('Message', { from })}
    >
      <Publication className={cn('MessageItem')} authorPosition={from === 'me' ? 'right' : 'left'}>
        <Publication.ChangeContainer />
        <Publication.MediaContainer media={media} />
        <Publication.Text className={cn('MessageItemText')} text={generateText(900)} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.DateCreated dateCreated={new Date()} />

        <Publication.Author />
        <Publication.DateCreated dateCreated={new Date()} />
        <Publication.DateRead dateDeliver={new Date()} dateRead={addDays(new Date(), -1)} />
      </Publication>
    </div>
  )
}
