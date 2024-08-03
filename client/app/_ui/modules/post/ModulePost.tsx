'use client'

import { useState } from 'react'
import { ModuleCreatePublication } from '@ui/modules/create-publication'
import { PostItem, PostItemType, PostsList } from './components'

interface PostProps {
  posts: any[]
}

export function ModulePost(props: PostProps) {
  const { posts } = props

  const [localPosts, setLocalPosts] = useState<PostItemType[]>([])

  console.log('localPosts', localPosts)

  return (
    <PostsList
      title="Мои публикации"
      posts={localPosts}
      createPostComponent={(
        <ModuleCreatePublication
          onSubmit={(data) => {
            console.log('Publication', data)
            // @ts-ignore
            setLocalPosts((prev) => ([
              ...prev,
              {
                ...data,
                id: new Date().toString(),
                comments: ['1', '2', '3', '4', '5'],
              },
            ]))
          }}
        />
    )}
      renderPosts={(posts) => posts.map((post) => <PostItem key={JSON.stringify(post)} post={post} />)}
    />
  )
}
