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
// TODO: временно для тестов
interface Ppdwe extends Omit<UserMessage, 'media'> {
  media?: Media111
}

export function Message(props: MessageProps) {
  const { message } = props
  const { id, author } = message

  const { profile } = useProfile()
  const [publication, setPublication] = useState<Ppdwe>({ ...message, media: undefined })

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media')
        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setPublication((prev) => ({ ...prev, media: data }))
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
      <Publication
        contextProps={{
          dateCreated: new Date(),
          dateChanged: undefined,
        }}
        className={cn('MessageItem')}
        authorPosition={from === 'me' ? 'right' : 'left'}
      >
        <Publication.ChangeContainer onSubmit={(d) => console.log('d', d)} />
        <Publication.MediaContainer
          text={publication.media?.text}
          audio={publication.media?.audio}
          video={publication.media?.video}
          image={publication.media?.image}
          other={publication.media?.other}
        />
        <Publication.Text className={cn('MessageItemText')} text={generateText(900)} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />

        <Publication.Author />
        <Publication.DateCreated />
        <Publication.DateRead dateDeliver={new Date()} dateRead={addDays(new Date(), -1)} />
      </Publication>
    </div>
  )
}
