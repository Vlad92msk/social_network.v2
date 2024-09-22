'use client'

import { get, groupBy } from 'lodash'
import { useMemo } from 'react'
import { useBooleanState } from '@hooks'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { cn } from './cn'
import { PostEntity } from '../../../../../../../swagger/posts/interfaces-posts'
import { postsApi } from '../../../../../../store/api'

interface PostsListProps {
  post: PostEntity
}

export function PostItem(props: PostsListProps) {
  const { post } = props
  const [onRemove] = postsApi.useRemoveMutation()
  const [onUpdate] = postsApi.useUpdateMutation()

  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)
  const gropedMediaByType = useMemo(() => groupBy(post.media, 'meta.type'), [post.media])

  return (
    <div className={cn()}>
      <Publication
        contextProps={{ id: post.id }}
        className={cn('PostItem')}
        authorPosition="right"
        onRead={(publicationId) => {
          // const newDate = subMinutes(new Date(), 1)
          // console.log('read', publicationId, newDate)
          // handleUpdateMsg({ id: publicationId, dateRead: newDate, dateDeliver: newDate })
        }}
      >
        <Publication.ChangeContainer
          onSubmit={(result) => {
            const { removeMediaIds: { video, voices, other, image, audio }, id } = result
            // console.log('onSubmit', result)
            onUpdate({
              id,
              body: {
                text: result?.text,
                remove_media_ids: [...image, ...audio, ...other],
                remove_video_ids: video,
                remove_voice_ids: voices,
              },
            })
            // handleUpdateMsg({ id, ..result, dateChanged: new Date() })
          }}
          onRemove={(id) => {
            onRemove({ id })
          }}
        />
        <Publication.MediaContainer
          audio={get(gropedMediaByType, 'audio')}
          voices={post.voices || []}
          video={post.videos || []}
          image={get(gropedMediaByType, 'image', [])}
          other={get(gropedMediaByType, 'other', [])}
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
        />
      )}
    </div>
  )
}
