// models/editor.ts
import { DraftHandleValue, EditorState, getDefaultKeyBinding, KeyBindingUtil, RichUtils } from 'draft-js'

import { EditorPlugin } from './hooks'

export const combinePlugins = (plugins: EditorPlugin[], setEditorState: (state: EditorState) => void) => ({
  keyBindingFn: (e: any) => {
    // Добавим preventDefault для наших команд
    if (KeyBindingUtil.hasCommandModifier(e)) {
      // Сначала проверяем плагины
      for (const plugin of plugins) {
        if (plugin.keyBindingFn) {
          const result = plugin.keyBindingFn(e)
          if (result) {
            e.preventDefault() // Предотвращаем стандартное поведение браузера
            return result
          }
        }
      }
    }
    // Если ни один плагин не обработал, используем стандартную обработку
    return getDefaultKeyBinding(e)
  },
  handleKeyCommand: (command: string, editorState: EditorState): DraftHandleValue => {
    // Сначала проверяем плагины
    for (const plugin of plugins) {
      if (plugin.handleKeyCommand) {
        const result = plugin.handleKeyCommand(command, editorState)
        if (result === 'handled') {
          return 'handled'
        }
        if (result && typeof result === 'object') {
          setEditorState(result)
          return 'handled'
        }
      }
    }

    // Затем проверяем встроенные команды rich-text редактора
    const defaultResult = RichUtils.handleKeyCommand(editorState, command)
    if (defaultResult) {
      setEditorState(defaultResult)
      return 'handled'
    }

    return 'not-handled'
  },
})
