'use client'

import { useParams } from 'next/navigation'
import { CreatePublication, CreatePublicationContextProps } from '@ui/components/create-publication'
import { PostItem, PostsList } from './components'
import { postsApi } from '../../../../store/api'
import { UserPageProps } from '../../../[locale]/[userId]/(content)/profile/page'

export function ModulePost() {
  const params = useParams<UserPageProps['params']>()
  const { data, isLoading } = postsApi.useFindAllQuery({ owner_public_id: params.userId })
  const [submit, { isLoading: isSubmitting }] = postsApi.useCreateMutation()

  const handleSubmit = (createdPost: CreatePublicationContextProps) => {
    // console.log('media', createdPost)
    const formData = new FormData()

    formData.append('text', createdPost.text)
    formData.append('type', 'post')

    if (createdPost.media) {
      Object.values(createdPost.media).flat().forEach((file) => {
        formData.append('media', file.blob, file.name)
      })
    }

    if (createdPost.voices) {
      createdPost.voices.forEach((file) => {
        formData.append('voices', file.blob, file.name)
      })
    }

    if (createdPost.videos) {
      createdPost.videos.forEach((file) => {
        formData.append('videos', file.blob, file.name)
      })
    }

    // @ts-ignore
    submit({ body: formData })
  }

  console.log('data', data)
  return (
    <PostsList
      title="Мои публикации"
      posts={data}
      isLoading={isLoading}
      createPostComponent={(
        <CreatePublication
          title="Создать запись"
          onSubmit={handleSubmit}
        />
    )}
      submitting={isSubmitting ? '....создается пост....' : null}
      renderPosts={(posts) => posts.map((post) => <PostItem key={post.id} post={post} />)}
    />
  )
}
