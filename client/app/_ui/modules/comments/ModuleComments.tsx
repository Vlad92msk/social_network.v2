'use client'

import { classNames } from '@utils/others'
import { cn } from './cn'
import { CommentsList, InputContainer } from './elements'
import { commentsApi } from '../../../../store/api'

export interface CommentsProps {
  className?: string;
  module: 'post' | 'commentary' | 'message'
  id: string
  onClose?: VoidFunction
}

export function ModuleComments(props: CommentsProps) {
  const { className, id, module, onClose } = props

  const { data } = commentsApi.useFindCommentsByPostQuery({ post_id: id })
  const [onAddComment] = commentsApi.useCreateMutation()

  return (
    <div className={classNames(cn(), className)}>
      <div className={cn('InputContainer')}>
        <InputContainer
          onClose={onClose}
          onSubmit={(text) => {
            console.log('Коммент добавлен', id, module, text)
            onAddComment({
              body: {
                text,
                type: module,
                post_id: id,
              },
            })
          }}
        />
      </div>
      <CommentsList comments={data?.data} />
    </div>
  )
}
