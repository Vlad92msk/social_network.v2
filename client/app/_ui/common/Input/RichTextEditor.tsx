import {
  ContentState, convertFromRaw, Editor as DraftEditor, Editor as DraftEditorType, EditorState, Modifier, RichUtils,
} from 'draft-js'
import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ButtonAddEmoji } from '@ui/common/ButtonAddEmoji'
import { classNames } from '@utils/others'
import { cn } from './cn'

// Убираем лишние типы, которые создавали проблемы
const Editor = DraftEditor

interface RichTextEditorProps {
  onValueChange?: (text: string) => void
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
  className?: string
  placeholder?: string
  initialValue?: string
}

export function RichTextEditor(props: RichTextEditorProps) {
  const {
    onValueChange,
    onStartTyping,
    onStopTyping,
    className,
    placeholder,
    initialValue,
  } = props

  // Создаем начальное состояние на основе initialValue
  const createInitialState = useCallback(() => {
    if (!initialValue) {
      return EditorState.createEmpty()
    }

    const contentState = ContentState.createFromText(initialValue)
    const editorState = EditorState.createWithContent(contentState)

    // Устанавливаем курсор в конец текста
    const lastBlock = contentState.getLastBlock()
    const lastBlockKey = lastBlock.getKey()
    const lastBlockLength = lastBlock.getLength()

    const selection = editorState.getSelection().merge({
      anchorKey: lastBlockKey,
      anchorOffset: lastBlockLength,
      focusKey: lastBlockKey,
      focusOffset: lastBlockLength,
    })

    return EditorState.forceSelection(editorState, selection)
  }, [initialValue])

  const [editorState, setEditorState] = useState(createInitialState)

  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Исправляем тип рефа
  const editorRef = useRef<DraftEditorType>(null)

  // Добавляем эффект для обновления состояния при изменении initialValue
  useEffect(() => {
    setEditorState(createInitialState())
  }, [createInitialState])


  // Перемещаем notifyTypingStart выше, чтобы исправить ESLint ошибку
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
    }, 1500)
  }, [isTyping, onStartTyping, onStopTyping])

  // Обработка изменения состояния редактора
  const handleEditorChange = (newState: EditorState) => {
    setEditorState(newState)

    const currentContent = newState.getCurrentContent()
    const text = currentContent.getPlainText()
    onValueChange?.(text)

    notifyTypingStart()
  }

  // Обработка горячих клавиш
  const handleKeyCommand = (command: string, state: EditorState) => {
    let newState: EditorState | null = null

    switch (command) {
      case 'bold':
        newState = RichUtils.toggleInlineStyle(state, 'BOLD')
        break
      case 'italic':
        newState = RichUtils.toggleInlineStyle(state, 'ITALIC')
        break
      case 'underline':
        newState = RichUtils.toggleInlineStyle(state, 'UNDERLINE')
        break
      default:
        newState = RichUtils.handleKeyCommand(state, command)
    }

    if (newState) {
      handleEditorChange(newState)
      return 'handled'
    }
    return 'not-handled'
  }

  // Добавление эмодзи
  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    // Получаем текущее состояние редактора
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()

    // Вставляем эмодзи в текущую позицию курсора
    const newContentState = Modifier.insertText(
      contentState,
      selectionState,
      emojiData.emoji,
    )

    // Создаем новое состояние с обновленным контентом
    let newEditorState = EditorState.push(
      editorState,
      newContentState,
      'insert-characters',
    )

    // Обновляем позицию курсора после вставки
    const newSelection = newEditorState.getSelection().merge({
      anchorOffset: selectionState.getAnchorOffset() + emojiData.emoji.length,
      focusOffset: selectionState.getFocusOffset() + emojiData.emoji.length,
    })

    // Применяем новую позицию курсора
    newEditorState = EditorState.forceSelection(newEditorState, newSelection)

    // Обновляем состояние редактора
    setEditorState(newEditorState)

    // Возвращаем фокус редактору
    setTimeout(() => {
      if (editorRef.current) {
        const editor = editorRef.current as any
        editor.focus()
      }
    }, 0)
  }, [editorState])

  // Загрузка сохраненного состояния
  useEffect(() => {
    const savedContent = localStorage.getItem('editorContent')
    if (savedContent) {
      const raw = JSON.parse(savedContent)
      const contentState = convertFromRaw(raw)
      setEditorState(EditorState.createWithContent(contentState))
    }
  }, [])

  return (
    <div className={classNames(cn('RichTextEditor'), className)}>
      {/* @ts-ignore */}
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={handleEditorChange}
        handleKeyCommand={handleKeyCommand}
        placeholder={placeholder}
      />
      <ButtonAddEmoji onEmojiClick={handleEmojiClick} />
    </div>
  )
}
