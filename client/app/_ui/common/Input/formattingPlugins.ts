// editorPlugins/formattingPlugins.ts
import { DraftHandleValue, EditorState, KeyBindingUtil, RichUtils } from 'draft-js'
import { KeyboardEvent } from 'react'
import { EditorPlugin } from './hooks'

// Плагин для создания ссылок
export const linkPlugin: EditorPlugin = {
  handleKeyCommand: (command, editorState) => {
    if (command === 'add-link') {
      const selection = editorState.getSelection()
      if (!selection.isCollapsed()) {
        const url = prompt('Введите URL:')
        if (url) {
          const contentState = editorState.getCurrentContent()
          const contentStateWithEntity = contentState.createEntity(
            'LINK',
            'MUTABLE',
            { url }
          )
          const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
          const newState = EditorState.set(
            editorState,
            { currentContent: contentStateWithEntity }
          )
          return RichUtils.toggleLink(newState, selection, entityKey)
        }
      }
    }
    return 'not-handled'
  },
  keyBindingFn: (e: KeyboardEvent<Element>) => {
    if (KeyBindingUtil.hasCommandModifier(e) && e.code === 'KeyK') {
      return 'add-link'
    }
    return null
  }
}

// Плагин для цветного текста
export const colorPlugin: EditorPlugin = {
  handleKeyCommand: (command, editorState) => {
    if (command === 'text-red') {
      return RichUtils.toggleInlineStyle(editorState, 'RED_TEXT')
    }
    if (command === 'text-green') {
      return RichUtils.toggleInlineStyle(editorState, 'GREEN_TEXT')
    }
    if (command === 'text-blue') {
      return RichUtils.toggleInlineStyle(editorState, 'BLUE_TEXT')
    }
    return 'not-handled'
  },
  keyBindingFn: (e: KeyboardEvent<Element>) => {
    if (KeyBindingUtil.hasCommandModifier(e)) {
      switch (e.code) {
        case 'KeyR': return 'text-red'
        case 'KeyG': return 'text-green'
        case 'KeyB': return 'text-blue'
        default: return null
      }
    }
    return null
  }
}

// Плагин для форматирования кода
export const codePlugin: EditorPlugin = {
  handleKeyCommand: (command, editorState) => {
    if (command === 'code-block') {
      return RichUtils.toggleInlineStyle(editorState, 'CODE_STYLE')
    }
    return 'not-handled'
  },
  keyBindingFn: (e: KeyboardEvent<Element>) => {
    if (KeyBindingUtil.hasCommandModifier(e) && e.code === 'KeyM') {
      return 'code-block'
    }
    return null
  }
}

// Плагин для волнистого подчеркивания
export const underlinePlugin: EditorPlugin = {
  handleKeyCommand: (command, editorState) => {
    if (command === 'wavy-underline') {
      return RichUtils.toggleInlineStyle(editorState, 'WAVY_UNDERLINE')
    }
    return 'not-handled'
  },
  keyBindingFn: (e: KeyboardEvent<Element>) => {
    if (KeyBindingUtil.hasCommandModifier(e) && e.code === 'KeyU') {
      return 'wavy-underline'
    }
    return null
  }
}
