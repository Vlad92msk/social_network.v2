'use client'

import { useState } from 'react'
import { CreatePublication } from '@ui/modules/create-publication'
import { PostItem, PostItemType, PostsList } from './components'

interface PostProps {
  posts: any[]
}

export function Post(props: PostProps) {
  const { posts } = props

  const [localPosts, setLocalPosts] = useState<PostItemType[]>([])

  console.log('localPosts', localPosts)

  return (
    <PostsList
      title="Мои публикации"
      posts={localPosts}
      createPostComponent={(
        <CreatePublication
          onSubmit={(data) => {
            console.log('Publication', data)
            // @ts-ignore
            setLocalPosts((prev) => ([
              ...prev,
              {
                ...data,
                id: new Date().toString(),
                comments: [
                  { text: 'comment 1', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 2', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 3', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 4', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 5', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 6', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                  { text: 'comment 7', dateCreated: new Date(), authorImg: 'base/me', authorName: 'author' },
                ],
              },
            ]))
          }}
        />
    )}
      renderPosts={(posts) => posts.map((post) => <PostItem key={JSON.stringify(post)} post={post} />)}
    />
  )
}
