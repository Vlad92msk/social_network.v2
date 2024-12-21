'use client'

import { boldDecorator, linkDecorator } from '@ui/common/Input/CustomComponent'
import { codePlugin, colorPlugin, linkPlugin, underlinePlugin, markdownBoldPlugin, markdownCodePlugin } from '@ui/common/Input/formattingPlugins'
import { Editor as DraftEditor, Editor as DraftEditorType, EditorState, Modifier, SelectionState } from 'draft-js'
import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef } from 'react'
import { ButtonAddEmoji } from '@ui/common/ButtonAddEmoji'
import { combinePlugins } from '@ui/common/Input/editorPlugins'
import { useEditorState } from '@ui/common/Input/hooks'
import { Text } from '@ui/common/Text'
import { classNames } from '@utils/others'
import { cn } from './cn'

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

const decorators = [linkDecorator, boldDecorator]
const plugins = [linkPlugin, colorPlugin, codePlugin, underlinePlugin, markdownBoldPlugin, markdownCodePlugin]
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
    {
      plugins,
      // decorators,
    },
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
    <>
      <Text className={classNames(cn('RichTextEditor'), className)}>
        {/* @ts-ignore */}
        <DraftEditor
          ref={editorRef}
          editorState={editorState}
          onChange={setEditorState}
          placeholder={placeholder}
          onFocus={handleFocus}
          readOnly={readOnly}
          customStyleMap={{
            RED_TEXT: { color: 'red' },
            GREEN_TEXT: { color: 'green' },
            BLUE_TEXT: { color: 'blue' },
            CODE_STYLE: {
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
              padding: '2px 4px',
              borderRadius: '3px',
            },
            WAVY_UNDERLINE: {
              textDecoration: 'wavy underline red'
            },
            CODE: {
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              padding: '2px 4px',
              borderRadius: '3px',
            },
          }}
          {...combinePlugins(plugins, setEditorState)}
        />
      </Text>
      <ButtonAddEmoji onEmojiClick={handleEmojiClick} />
    </>
  )
}
