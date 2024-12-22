'use client'

import { Editor as DraftEditor, Editor as DraftEditorType, EditorState, Modifier, SelectionState } from 'draft-js'
import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef } from 'react'
import { ButtonAddEmoji } from '@ui/common/ButtonAddEmoji'
import { Text } from '@ui/common/Text'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { linkDecorator, urlDecorator } from './CustomComponent'
import { combinePlugins } from './editorPlugins'
import { linkPlugin, markdownBoldPlugin } from './formattingPlugins'
import { useEditorState } from './hooks'
import { blockRendererFn } from './prismDecorator'

interface RichTextEditorProps {
  onValueChange?: (text: string) => void
  onStartTyping?: VoidFunction
  onStopTyping?: VoidFunction
  className?: string
  placeholder?: string
  initialValue?: string
  readOnly?: boolean
  onInit?: (controls: { reset: () => void }) => void
}

const plugins = [linkPlugin]
const decorators = [linkDecorator, urlDecorator]
export function RichTextEditor(props: RichTextEditorProps) {
  const {
    onValueChange,
    onStartTyping,
    onStopTyping,
    className,
    placeholder,
    initialValue,
    readOnly,
    onInit,
  } = props

  const editorRef = useRef<DraftEditorType>(null)
  const lastSelectionRef = useRef<SelectionState>(null)

  const { editorState, setEditorState, setText } = useEditorState(
    initialValue,
    { plugins, decorators },
    {
      onTextChange: onValueChange,
      onStateChange: (newState) => {
        lastSelectionRef.current = newState.getSelection()
      },
      onStartTyping,
      onStopTyping,
      typingDelay: 1500,
      onError: (error) => console.error('Error:', error),
    },
  )

  useEffect(() => {
    onInit?.({
      reset: () => setText(initialValue || ''),
    })
  }, [onInit, setText, initialValue])

  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const selection = editorState.getSelection().getHasFocus()
      ? editorState.getSelection()
      : lastSelectionRef.current || editorState.getSelection()

    const newEditorState = EditorState.push(
      editorState,
      Modifier.insertText(
        editorState.getCurrentContent(),
        selection,
        emojiData.emoji,
      ),
      'insert-characters',
    )

    const newSelection = selection.merge({
      anchorOffset: selection.getAnchorOffset() + emojiData.emoji.length,
      focusOffset: selection.getFocusOffset() + emojiData.emoji.length,
    })

    setEditorState(EditorState.forceSelection(newEditorState, newSelection))
    requestAnimationFrame(() => editorRef.current?.focus())
  }, [editorState, setEditorState])

  const handleFocus = useCallback(() => {
    if (lastSelectionRef.current) {
      setEditorState(
        EditorState.forceSelection(editorState, lastSelectionRef.current),
      )
    }
  }, [editorState, setEditorState])

  return (
    <Text className={classNames(cn('RichTextEditor'), className)}>
      {/* @ts-ignore */}
      <DraftEditor
        ref={editorRef}
        editorState={editorState}
        onChange={setEditorState}
        placeholder={placeholder}
        onFocus={handleFocus}
        readOnly={readOnly}
        blockRendererFn={blockRendererFn}
        {...combinePlugins(plugins, setEditorState)}
      />
      {!readOnly && (
        <ButtonAddEmoji onEmojiClick={handleEmojiClick} />
      )}
    </Text>
  )
}
