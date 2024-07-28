'use client'

import { Button } from '@ui/common/Button'
import { Text } from '@ui/common/Text'
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
      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
        <Button onClick={() => console.log('Создать пост')}>Создать</Button>
      </div>
      <div className={cn('List')}>
        {renderPosts(posts)}
      </div>
    </div>
  )
}
