'use client'

import { get, groupBy } from 'lodash'
import { useMemo } from 'react'
import { useBooleanState } from '@hooks'
import { Text } from '@ui/common/Text'
import { Publication } from '@ui/components/Publication'
import { ModuleComments } from '@ui/modules/comments'
import { cn } from './cn'
import { PostResponseDto } from '../../../../../../../swagger/posts/interfaces-posts'
import { postsApi, reactionsApi } from '../../../../../../store/api'

interface PostsListProps {
  post: PostResponseDto
}

export function PostItem(props: PostsListProps) {
  const { post } = props
  const [onRemove] = postsApi.useRemoveMutation()
  const [onUpdate] = postsApi.useUpdateMutation()
  const [onPin] = postsApi.useTogglePinPostMutation()
  const [onToggleReaction] = reactionsApi.useCreateMutation()

  const [isOpenComments, onOpenComments, onCloseComments] = useBooleanState(false)
  const gropedMediaByType = useMemo(() => groupBy(post.media, 'meta.type'), [post.media])

  return (
    <div className={cn({ pinned: post.pinned })}>
      {post.pinned && (<Text>Закреплено</Text>)}
      <Publication
        contextProps={{ id: post.id, dateChanged: post.date_updated }}
        className={cn('PostItem')}
        authorPosition="right"
        onRead={() => {
          // const newDate = subMinutes(new Date(), 1)
          // console.log('read', publicationId, newDate)
          // handleUpdateMsg({ id: publicationId, dateRead: newDate, dateDeliver: newDate })
        }}
      >
        <Publication.ChangeContainer
          // Обновить пост
          onSubmit={(result) => {
            const { removeMediaIds: { video, voices, other, image, audio }, media, id } = result
            console.log('result', result)
            const updatePost: Parameters<typeof onUpdate>[0] = {
              id,
              body: {
                remove_media_ids: [...image, ...audio, ...other],
                remove_video_ids: video,
                remove_voice_ids: voices,
              },
            }
            if (result?.text) {
              updatePost.body.text = result.text
            }
            console.log('updatePost', updatePost)
            onUpdate(updatePost)
          }}
          // Удалить пост
          onRemove={(id) => {
            onRemove({ id })
          }}
          // Закрепить пост
          onPin={(id) => {
            onPin({ id })
          }}
        />
        <Publication.MediaContainer
          voices={post.voices || []}
          video={post.videos || []}
          audio={get(gropedMediaByType, 'audio')}
          image={get(gropedMediaByType, 'image', [])}
          other={get(gropedMediaByType, 'other', [])}
        />
        <Publication.Text className={cn('MessageItemText')} text={post.text} />
        <Publication.Commets isActive={isOpenComments} countComments={post?.comment_count} onClick={isOpenComments ? onCloseComments : onOpenComments} />
        <Publication.Emojies
          reactions={post.reaction_info}
          onClick={(emojie) => {
            onToggleReaction({
              entity_type: 'post',
              entity_id: post.id,
              body: { name: emojie.name },
            })
          }}
        />
        <Publication.DateCreated dateCreated={new Date(post.date_created)} />
      </Publication>
      {isOpenComments && (
        <ModuleComments
          target="post"
          id={post.id}
          onClose={onCloseComments}
        />
      )}
    </div>
  )
}
