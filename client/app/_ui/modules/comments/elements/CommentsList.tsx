import { cn } from '../cn'
import { Comment } from './Comment'
import { classNames } from '@utils/others'

export const CommentsList = () => {


  return (
    <div className={classNames(cn('CommentsList'))}>
      <Comment text={'comment 1'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 2'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 3'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 4'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 5'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
      <Comment text={'comment 6'} authorImg={'base/me'} authorName={'author'} dateCreated={new Date()}/>
    </div>
  )
}
