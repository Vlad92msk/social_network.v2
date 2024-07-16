'use client'

import { addDays } from 'date-fns'
import { useEffect, useState } from 'react'
import { Publication } from '@ui/components/Publication'
import { Media111 } from '@ui/components/Publication/elements'
import { makeCn } from '@utils/others'
import { generateText } from './data'
import style from './Publication.module.scss'

const cn = makeCn('Pub', style)

export function Pub() {
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
    <Publication className={cn()}>
      <Publication.ChangeContainer />
      <Publication.MediaContainer media={media} />
      <Publication.Text text={generateText(900)} />
      <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
      <Publication.Commets countComments={10} onClick={() => console.log('dwe')} />
      <Publication.DateCreated dateCreated={new Date()} />

      <Publication.Author />
      <Publication.DateRead dateDeliver={new Date()} dateRead={addDays(new Date(), 1)} />
    </Publication>
  )
}
