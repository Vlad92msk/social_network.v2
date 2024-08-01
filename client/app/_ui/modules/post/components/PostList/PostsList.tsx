'use client'

import { Text } from '@ui/common/Text'
import { CreatePublication } from '@ui/modules/create-publication'
import { cn } from './cn'

interface PostsListProps<Posts> {
  posts: Posts
  title?: string
  renderPosts: (posts: Posts) => React.ReactNode
}

export function PostsList<Posts extends any[], >(props: PostsListProps<Posts>) {
  const { posts, title, renderPosts } = props
  return (
    <div className={cn()}>
      <CreatePublication onSubmit={(data) => console.log('Publication', data)} />

      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
      </div>
      <div className={cn('List')}>
        {renderPosts(posts)}
      </div>
    </div>
  )
}
