'use client'

import { compositeDecorator } from '@ui/common/Input/CodeBlock'
import {
  Editor as DraftEditor,
  Editor as DraftEditorType,
  EditorState, getDefaultKeyBinding, KeyBindingUtil,
  Modifier,
  RichUtils, SelectionState,
} from 'draft-js'
import { EmojiClickData } from 'emoji-picker-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ButtonAddEmoji } from '@ui/common/ButtonAddEmoji'
import { editorStateFromString, editorStateToPlainText, useEditorState } from '@ui/common/Input/hooks'
import { Text } from '@ui/common/Text'
import { classNames } from '@utils/others'
import { cn } from './cn'


// Добавляем стили для code blocks
const styles = `
    .code-block {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 1em;
      margin: 0.5em 0;
      overflow-x: auto;
    }
    
    .code-block code {
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.4;
    }
  `;

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

// Функция для применения кастомного стиля
const toggleCustomStyle = (editorState: EditorState) => {
  const selection = editorState.getSelection();
  const currentContent = editorState.getCurrentContent();
  const currentStyle = editorState.getCurrentInlineStyle();

  // Применяем или убираем стиль
  const newState = currentStyle.has('CUSTOM_STYLE')
    ? RichUtils.toggleInlineStyle(editorState, 'CUSTOM_STYLE')
    : EditorState.push(
      editorState,
      Modifier.applyInlineStyle(
        currentContent,
        selection,
        'CUSTOM_STYLE'
      ),
      'change-inline-style'
    );

  return newState;
};

const keyBindingFn = (e: any) => {
  if (KeyBindingUtil.hasCommandModifier(e) && e.keyCode === 80) { // 80 это код клавиши 'P'
    return 'custom-style';
  }
  return getDefaultKeyBinding(e);
};

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
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

  const { editorState, setEditorState, getText, setText } = useEditorState(initialValue, compositeDecorator);

  useEffect(() => {
    onInit?.({
      reset: () => {
        setText(initialValue || '')
      },
    })
  }, [onInit, setText, initialValue])

  useEffect(() => {
    if (initialValue) {
      setEditorState(editorStateFromString(initialValue))
    }
  }, [initialValue, setEditorState])

  const handleTyping = useCallback(() => {
    onStartTyping?.()

    // Очищаем предыдущий таймер если он есть
    clearTimeout(typingTimeoutRef.current!)

    // Устанавливаем новый
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.()
    }, 1500)
  }, [onStartTyping, onStopTyping])

  // Основной обработчик изменений
  const handleEditorChange = useCallback((newState: EditorState) => {
    lastSelectionRef.current = newState.getSelection()
    setEditorState(newState)
    onValueChange?.(getText())
    handleTyping()
  }, [getText, handleTyping, onValueChange, setEditorState])


  const handleKeyCommand = useCallback((command: string, state: EditorState) => {
    if (command === 'custom-style') {
      const newState = toggleCustomStyle(state);
      handleEditorChange(newState);
      return 'handled';
    }

    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      handleEditorChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }, [handleEditorChange]);

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

    handleEditorChange(EditorState.forceSelection(newEditorState, newSelection))

    requestAnimationFrame(() => editorRef.current?.focus())
  }, [editorState, handleEditorChange])

  // Обработка фокуса
  const handleFocus = useCallback(() => {
    if (lastSelectionRef.current) {
      setEditorState(
        EditorState.forceSelection(editorState, lastSelectionRef.current),
      )
    }
  }, [editorState, setEditorState])


  return (
    <>
      <style>{styles}</style>
      <Text className={classNames(cn('RichTextEditor'), className)}>
        {/* @ts-ignore */}
        <DraftEditor
          ref={editorRef}
          editorState={editorState}
          onChange={handleEditorChange}
          handleKeyCommand={handleKeyCommand}
          placeholder={placeholder}
          onFocus={handleFocus}
          readOnly={readOnly}
          keyBindingFn={keyBindingFn}
        />
      </Text>
      <ButtonAddEmoji onEmojiClick={handleEmojiClick} />
    </>
  )
}
