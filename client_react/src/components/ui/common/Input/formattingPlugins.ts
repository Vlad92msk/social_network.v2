import { EditorState, KeyBindingUtil, Modifier, RichUtils, SelectionState } from 'draft-js'
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
          // Создаем новый contentState с entity для ссылки
          const contentState = editorState.getCurrentContent()
          const contentStateWithEntity = contentState.createEntity(
            'LINK',
            'MUTABLE',
            { url },
          )
          const entityKey = contentStateWithEntity.getLastCreatedEntityKey()

          // Применяем entity к выделенному тексту
          const newContentState = Modifier.applyEntity(
            contentStateWithEntity,
            selection,
            entityKey,
          )

          // Создаем новое состояние редактора
          const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'apply-entity',
          )

          // Важно: возвращаем новое состояние
          return newEditorState
        }
      }
    }
    return 'not-handled'
  },
  keyBindingFn: (e) => {
    if (KeyBindingUtil.hasCommandModifier(e) && e.code === 'KeyK') {
      return 'add-link'
    }
    return null
  },
}

// Плагин для цветного текста (пример)
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
  },
}

export const markdownBoldPlugin: EditorPlugin = {
  onChange: (editorState: EditorState) => {
    const content = editorState.getCurrentContent()
    const selection = editorState.getSelection()
    const block = content.getBlockForKey(selection.getStartKey())
    const text = block.getText()
    const position = selection.getAnchorOffset()

    // Проверяем наличие жирного стиля
    const currentStyles = editorState.getCurrentInlineStyle()
    const isBold = currentStyles.has('BOLD')

    // Проверяем было ли удаление
    const lastChangeType = editorState.getLastChangeType()
    const isBackspace = lastChangeType === 'backspace-character'

    // Если текст жирный и произошло удаление
    if (isBold && isBackspace) {
      // Снимаем жирный стиль со всего текста
      let newContent = Modifier.removeInlineStyle(
        content,
        selection.merge({
          anchorOffset: 0,
          focusOffset: text.length,
        }),
        'BOLD',
      )

      // Добавляем звездочки вокруг текста
      newContent = Modifier.replaceText(
        newContent,
        selection.merge({
          anchorOffset: 0,
          focusOffset: text.length,
        }),
        `**${text}*`,
      )

      const newState = EditorState.push(
        editorState,
        newContent,
        'change-inline-style',
      )

      // Устанавливаем курсор в конец текста
      return EditorState.forceSelection(
        newState,
        SelectionState.createEmpty(block.getKey()).merge({
          anchorOffset: text.length + 3, // +3 для учета добавленных звездочек
          focusOffset: text.length + 3,
        }),
      )
    }

    // Если вводятся первые звездочки - ничего не делаем
    if (text === '**' || text.endsWith('**') && !text.slice(0, -2).includes('**')) {
      return editorState
    }

    // Если последний символ * и перед ним *
    if (position >= 2 && text.slice(position - 2, position) === '**') {
      const openingStarsPos = text.lastIndexOf('**', position - 3)

      if (openingStarsPos !== -1) {
        const textBetweenStars = text.slice(openingStarsPos + 2, position - 2)

        const fullSelection = SelectionState.createEmpty(block.getKey()).merge({
          anchorOffset: openingStarsPos,
          focusOffset: position,
        })

        let newContent = Modifier.replaceText(
          content,
          fullSelection,
          textBetweenStars,
        )

        newContent = Modifier.applyInlineStyle(
          newContent,
          SelectionState.createEmpty(block.getKey()).merge({
            anchorOffset: openingStarsPos,
            focusOffset: openingStarsPos + textBetweenStars.length,
          }),
          'BOLD',
        )

        return EditorState.forceSelection(
          EditorState.push(editorState, newContent, 'change-inline-style'),
          SelectionState.createEmpty(block.getKey()).merge({
            anchorOffset: openingStarsPos + textBetweenStars.length,
            focusOffset: openingStarsPos + textBetweenStars.length,
          }),
        )
      }
    }

    return editorState
  },
}
