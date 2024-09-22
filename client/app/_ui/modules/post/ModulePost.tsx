'use client'

import { useProfile } from '@hooks'
import { CreatePublication, CreatePublicationContextProps } from '@ui/components/create-publication'
import { uniq } from 'lodash'
import { PostItem, PostsList } from './components'
import { postsApi } from '../../../../store/api'

interface PostProps {
  posts: any[]
}

export function ModulePost() {
  const { profile } = useProfile()

  const { data, isLoading } = postsApi.useFindAllQuery({})
  const [submit, { isLoading: isSubmitting }] = postsApi.useCreateMutation()
console.log('data', data)
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
