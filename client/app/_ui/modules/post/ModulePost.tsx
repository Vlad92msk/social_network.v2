'use client'

import { useState } from 'react'
import { useProfile } from '@hooks'
import { CreatePublication, CreatePublicationContextProps } from '@ui/components/create-publication'
import { PostItem, PostItemType, PostsList } from './components'
import { postsApi } from '../../../../store/api'

interface PostProps {
  posts: any[]
}

export function ModulePost(props: PostProps) {
  const { posts } = props
  const { profile } = useProfile()

  const { data } = postsApi.useFindAllQuery(undefined)
  const [localPosts, setLocalPosts] = useState<PostItemType[]>([])
console.log('data', data)
  const [submit] = postsApi.useCreateMutation()

  const handleSubmit = (createdPost: CreatePublicationContextProps) => {
    const formData = new FormData()
    formData.append('text', createdPost.text)
    formData.append('type', 'post')

    // Append media files
    if (createdPost.media) {
      Object.values(createdPost.media).flat().forEach((file, index) => {
        formData.append(`media`, file.blob, file.name)
      })
    }

    console.log('voices', createdPost.voices)
    console.log('media', createdPost.media)
    // Append voice files
    if (createdPost.voices) {
      createdPost.voices.forEach((file, index) => {
        formData.append(`voices`, file.blob,  file.name)
      })
    }

    // Append video files
    if (createdPost.videos) {
      createdPost.videos.forEach((file, index) => {
        formData.append(`videos`, file.blob,  file.name)
      })
    }

    submit({ body: formData })
  }

  return (
    <PostsList
      title="Мои публикации"
      posts={data || []}
      createPostComponent={(
        <CreatePublication
          title="Создать запись"
          onSubmit={handleSubmit}
        />
    )}
      renderPosts={(posts) => posts.map((post) => <PostItem key={post.id} post={post} />)}
    />
  )
}
