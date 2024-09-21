'use client'

import { ReactNode } from 'react'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text'
import { cn } from './cn'

interface PostsListProps<Posts> {
  posts?: Posts
  isLoading: boolean
  title?: string
  renderPosts: (posts: Posts) => React.ReactNode
  createPostComponent: ReactNode
}

export function PostsList<Posts extends unknown[], >(props: PostsListProps<Posts>) {
  const { posts = [], title, renderPosts, createPostComponent, isLoading } = props
  return (
    <div className={cn()}>
      {createPostComponent}

      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
      </div>
      <div className={cn('List')}>
        {isLoading ? <Spinner /> : renderPosts(posts as Posts)}
      </div>
    </div>
  )
}
