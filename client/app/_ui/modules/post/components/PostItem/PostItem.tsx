'use client'

import { subMinutes } from 'date-fns'
import { useBooleanState, useProfile } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { PostEntity } from '../../../../../../../swagger/posts/interfaces-posts'
import { cn } from './cn'
import { PublicationDTO } from '../../../../../types/publicationDTO'

export interface PostItemType extends Pick<PublicationDTO, 'text' | 'emojis' | 'media' | 'voices' | 'videos' | 'commentsIds'>{
  id: string
}

interface PostsListProps {
  post: PostEntity
}

export function PostItem(props: PostsListProps) {
  const { post } = props

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
          // text={post.media?.text}
          // audio={[...(post.audio || []), ...(post.voices || []).map((item) => ({ ...item, src: item.url }))]}
  // @ts-ignore

          audio={[...(post.voices || []).map((item) => ({ ...item, src: item.meta.src }))]}
  // @ts-ignore

          video={[...(post.videos || []).map((item) => ({ ...item, src: item.meta.src }))]}
          // image={post.media?.image}
  // @ts-ignore

          other={post.media}
        />
        <Publication.Text className={cn('MessageItemText')} text={post.text} />
        <Publication.Commets countComments={post?.comment_count} onClick={onOpenComments} />
        <Publication.Emojies onClick={(emojie) => console.log(`нажали на эмоцию ${emojie.name}`)} />
        <Publication.DateCreated dateCreated={new Date(post.date_created)} />
      </Publication>
      {isOpenComments && (
        <ModuleComments
          module="post"
          id={post.id}
          onClose={onCloseComments}
          // commentsIds={post.commentsIds}
        />
      )}
    </div>
  )
}
