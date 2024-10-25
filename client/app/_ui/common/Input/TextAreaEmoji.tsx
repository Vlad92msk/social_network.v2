import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from './cn'
import { InputCommonProps, TextArea } from './TextArea'
import { ButtonAddEmoji } from '../ButtonAddEmoji'

interface TextAreaEmojiProps extends InputCommonProps {
  onValueChange?: (value: string) => void
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
  value: string
}

export function TextAreaEmoji(props: TextAreaEmojiProps) {
  const { value, onChange, onValueChange, onStopTyping, onStartTyping, ...rest } = props
  const [text, setText] = useState(value || '')
  const [isTyping, setIsTyping] = useState(false) // состояние набора текста
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null) // для сброса таймера
  const [cursorPosition, setCursorPosition] = useState(0)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  console.log('text', text)
  useEffect(() => {
    if (value !== text) {
      setText(value)
    }
  }, [value, text])

  const notifyTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      onStartTyping?.()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onStopTyping?.()
    }, 1500) // Ожидание 2 секунды после последнего ввода
  }, [isTyping, onStartTyping, onStopTyping])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value
    setText(newValue)
    onChange?.(event)
    onValueChange?.(newValue)
    notifyTypingStart() // Запускаем логику отслеживания печати
  }, [onChange, onValueChange, notifyTypingStart])

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
