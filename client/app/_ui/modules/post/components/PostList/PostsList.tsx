'use client'

import { ReactNode } from 'react'
import { Text } from '@ui/common/Text'
import { cn } from './cn'

interface PostsListProps<Posts> {
  posts: Posts
  title?: string
  renderPosts: (posts: Posts) => React.ReactNode
  createPostComponent: ReactNode
}

export function PostsList<Posts extends any[], >(props: PostsListProps<Posts>) {
  const { posts, title, renderPosts, createPostComponent } = props
  return (
    <div className={cn()}>
      {createPostComponent}

      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
      </div>
      <div className={cn('List')}>
        {renderPosts(posts)}
      </div>
    </div>
  )
}
