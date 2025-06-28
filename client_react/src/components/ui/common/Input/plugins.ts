// plugins/customStylePlugin.ts
import { KeyboardEvent } from 'react'
import { EditorState, KeyBindingUtil, Modifier, RichUtils } from 'draft-js'

import { EditorPlugin } from './hooks'

const toggleCustomStyle = (editorState: EditorState): EditorState => {
  const selection = editorState.getSelection()
  const currentContent = editorState.getCurrentContent()
  const currentStyle = editorState.getCurrentInlineStyle()

  return currentStyle.has('CUSTOM_STYLE')
    ? RichUtils.toggleInlineStyle(editorState, 'CUSTOM_STYLE')
    : EditorState.push(editorState, Modifier.applyInlineStyle(currentContent, selection, 'CUSTOM_STYLE'), 'change-inline-style')
}

export const customStylePlugin: EditorPlugin = {
  handleKeyCommand: (command, editorState) => {
    if (command === 'custom-style') {
      const newState = toggleCustomStyle(editorState)
      // Если изменение состояния прошло успешно
      if (newState !== editorState) {
        // значит команда обработана
        return 'handled'
      }
    }
    return 'not-handled'
  },
  keyBindingFn: (e: KeyboardEvent<Element>) => {
    if (KeyBindingUtil.hasCommandModifier(e) && e.keyCode === 80) {
      return 'custom-style'
    }
    return null
  },
}

// plugins/emojiPlugin.ts
export const emojiPlugin: EditorPlugin = {
  handleKeyCommand: (command) => {
    if (command === 'insert-emoji') {
      // логика вставки эмодзи
      return 'handled'
    }
    return 'not-handled'
  },
  keyBindingFn: (e) =>
    // ваша логика для эмодзи
    null,
}
