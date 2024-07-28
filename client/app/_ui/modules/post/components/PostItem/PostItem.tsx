'use client'

import { subMinutes } from 'date-fns'
import { useEffect, useState } from 'react'
import { useBooleanState, useProfile } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { Media111 } from '@ui/components/Publication/elements'
import { Comments } from '@ui/modules/comments'
import { cn } from './cn'
import { generateText } from '../../../../../[locale]/[userId]/(content)/profile/_components/data'

interface PostsListProps {
  id?: string
}

export function PostItem(props: PostsListProps) {
  const { id } = props

  const { profile } = useProfile()
  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)

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

  return (
    <div className={cn()}>
      <Publication
        // contextProps={{ dateChanged, id }}
        className={cn('PostItem')}
        authorPosition="right"
        dateRead={new Date()}
        onRead={(publicationId) => {
          const newDate = subMinutes(new Date(), 1)
          console.log('read', publicationId, newDate)
          // handleUpdateMsg({ id: publicationId, dateRead: newDate, dateDeliver: newDate })
        }}
      >
        <Publication.ChangeContainer
          onSubmit={(result) => {
            console.log('result', result)
            // handleUpdateMsg({ id, ...result, dateChanged: new Date() })
          }}
          onRemove={(result) => {
            console.log('result', result)
          }}
        />
        <Publication.MediaContainer
          text={media?.text}
          // audio={media?.audio}
          // video={media?.video}
          // image={media?.image}
          // other={media?.other}
        />
        <Publication.Text className={cn('MessageItemText')} text={generateText(300)} />
        <Publication.Commets countComments={19} onClick={onOpenComments} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.DateCreated dateCreated={new Date()} />
      </Publication>
      {isOpenComments && (<Comments module="post" id={id} onClose={onCloseComments} />)}
    </div>
  )
}
