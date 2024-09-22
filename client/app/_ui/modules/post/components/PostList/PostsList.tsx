'use client'

import { ReactNode } from 'react'
import { Spinner } from '@ui/common/Spinner'
import { Text } from '@ui/common/Text'
import { cn } from './cn'

interface PostsListProps<Posts> {
  posts?: Posts
  isLoading: boolean
  title?: string
  submitting?: ReactNode
  renderPosts: (posts: Posts) => ReactNode
  createPostComponent: ReactNode
}

export function PostsList<Posts extends unknown[], >(props: PostsListProps<Posts>) {
  const { posts = [], title, renderPosts, createPostComponent, isLoading, submitting } = props
  return (
    <div className={cn()}>
      {createPostComponent}

      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
      </div>
      <div className={cn('List')}>
        {submitting}
        {isLoading ? <Spinner /> : renderPosts(posts as Posts)}
      </div>
    </div>
  )
}
