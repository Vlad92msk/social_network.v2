'use client'

import { PostItem, PostsList } from './components'

interface PostProps {
  posts: any[]
}

export function Post(props: PostProps) {
  const { posts } = props
  return (
    <PostsList
      title="Мои публикации"
      posts={posts}
      renderPosts={(posts) => posts.map((a) => <PostItem key={a} id={a} />)}
    />
  )
}
