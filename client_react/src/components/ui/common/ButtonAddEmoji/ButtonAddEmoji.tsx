import { Emoji, EmojiStyle, Theme } from '@components/ui'
import { makeCn } from '@utils'
import { EmojiClickData } from 'emoji-picker-react'

import { Button } from '../Button'
import { Icon } from '../icon'
import { Popover } from '../Popover'
import style from './ButtonAddEmoji.module.scss'

export const cn = makeCn('ButtonAddEmoji', style)

interface ButtonAddEmojiProps {
  isReactions?: boolean
  onEmojiClick?: (emoji: EmojiClickData) => void
  onReactionClick?: (emoji: EmojiClickData) => void
}

export function ButtonAddEmoji(props: ButtonAddEmojiProps) {
  const { isReactions, onEmojiClick, onReactionClick } = props

  return (
    <Popover
      strategy="fixed"
      content={
        <div className={cn()}>
          <Emoji
            lazyLoadEmojis
            width="100%"
            height="100%"
            skinTonesDisabled
            searchDisabled
            theme={Theme.AUTO}
            emojiStyle={EmojiStyle.APPLE}
            open
            previewConfig={{
              showPreview: false,
            }}
            onEmojiClick={onEmojiClick}
            onReactionClick={onReactionClick}
          />
        </div>
      }
    >
      <Button className={cn('ButtonAddSmiles')}>
        <Icon name="face-smiling" />
      </Button>
    </Popover>
  )
}
