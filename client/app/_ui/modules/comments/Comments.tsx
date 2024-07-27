'use client'

import { Comment } from './elements'
import { classNames } from '@utils/others'
import { cn } from './cn'

interface CommentsProps {
  className?: string;
}

export function Comments(props: CommentsProps) {
  const { className } = props
  return (
    <div className={classNames(cn(), className)}>
      <Comment text={'comment 1'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 2'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 3'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 4'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 5'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()} />
    </div>
  )
}
