'use client'

import { addDays } from 'date-fns'
import { Publication } from '@ui/components/Publication'

export function Pub() {
  return (
    <Publication>
      <Publication.ChangeContainer />
      <Publication.MediaContainer />
      <Publication.Text text="text message" />
      <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
      <Publication.Commets countComments={10} onClick={() => console.log('dwe')} />
      <Publication.DateCreated dateCreated={new Date()} />

      <Publication.Author />
      <Publication.DateRead dateDeliver={new Date()} dateRead={addDays(new Date(), 1)} />
    </Publication>
  )
}
