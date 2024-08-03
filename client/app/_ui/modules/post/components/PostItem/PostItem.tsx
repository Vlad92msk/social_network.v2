'use client'

import { subMinutes } from 'date-fns'
import { useBooleanState, useProfile } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { cn } from './cn'
import { PublicationDTO } from '../../../../../types/publicationDTO'

export interface PostItemType extends Pick<PublicationDTO, 'text' | 'emojis' | 'media' | 'voices' | 'videos' | 'commentsIds'>{
  id: string
}

interface PostsListProps {
  post: PostItemType
}

export function PostItem(props: PostsListProps) {
  const { post } = props

  const { profile } = useProfile()
  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)

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
          text={post.media?.text}
          audio={[...(post.media?.audio || []), ...(post.voices || []).map((item) => ({ ...item, src: item.url }))]}
          video={[...(post.media?.video || []), ...(post.videos || []).map((item) => ({ ...item, src: item.url }))]}
          image={post.media?.image}
          other={post.media?.other}
        />
        <Publication.Text className={cn('MessageItemText')} text={post.text} />
        <Publication.Commets countComments={post?.commentsIds?.length || 0} onClick={onOpenComments} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.DateCreated dateCreated={new Date()} />
      </Publication>
      {isOpenComments && (
        <ModuleComments
          module="post"
          id={post.id}
          onClose={onCloseComments}
          commentsIds={post.commentsIds}
        />
      )}
    </div>
  )
}
