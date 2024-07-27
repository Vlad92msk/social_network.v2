import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from './cn'
import { InputCommonProps, TextArea } from './TextArea'
import { ButtonAddEmoji } from '../ButtonAddEmoji'

interface TextAreaEmojiProps extends InputCommonProps {
  onValueChange?: (value: string) => void
  value: string
}

export function TextAreaEmoji(props: TextAreaEmojiProps) {
  const { value, onChange, onValueChange, ...rest } = props
  const [text, setText] = useState(value || '')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (value !== text) {
      setText(value)
    }
  }, [value, text])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    setText(newValue)
    onChange?.(event)
    onValueChange?.(newValue)
  }, [onChange, onValueChange])

  const handleSelect = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(event.currentTarget.selectionStart)
  }, [])

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const { emoji } = emojiData
    const newText = text.slice(0, cursorPosition) + emoji + text.slice(cursorPosition)
    const newCursorPosition = cursorPosition + emoji.length

    setText(newText)
    onValueChange?.(newText)

    if (textAreaRef.current) {
      textAreaRef.current.focus()
      textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
    }

    setCursorPosition(newCursorPosition)
  }, [cursorPosition, text, onValueChange])

  return (
    <div className={cn('TextAreaEmojiWrapper')}>
      <TextArea
        ref={textAreaRef}
        className={cn('TextAreaEmojiInputMessage')}
        placeholder="Сообщение"
        value={text}
        onChange={handleChange}
        onSelect={handleSelect}
        {...rest}
      />
      <ButtonAddEmoji
        onEmojiClick={handleEmojiClick}
      />
    </div>
  )
}
