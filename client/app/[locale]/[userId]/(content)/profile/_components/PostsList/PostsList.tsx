import { ReactElement } from 'react'
import { Button } from '@ui/common/Button'
import { Text } from '@ui/common/Text'
import { makeCn } from '@utils/others'
import style from './PostsList.module.scss'

const cn = makeCn('PostsList', style)

interface PostsListProps<Posts> {
  renderPosts: (data: Posts) => ReactElement
  posts: Posts
  title?: string
}

export function PostsList<Posts extends any[], >(props: PostsListProps<Posts>) {
  const { renderPosts, posts, title } = props
  return (
    <div className={cn()}>
      <div className={cn('Header')}>
        <Text uppercase fs="16" weight="bold" letterSpacing={0.1}>{title}</Text>
        <Button>Создать</Button>
      </div>
      <div className={cn('List')}>{renderPosts(posts)}</div>
    </div>
  )
}
