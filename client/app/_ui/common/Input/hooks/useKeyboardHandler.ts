import { KeyboardEvent, useEffect, useRef } from 'react'

// Типы для форматирования
type FormattingTags = {
  startTag: string
  endTag: string
  command: string // Добавляем команду для execCommand
}

// Интерфейс для конфигурации горячих клавиш
interface HotkeyConfig {
  key: string
  requireShift?: boolean
  formatting: FormattingTags
}

// Enum для поддерживаемых команд форматирования
enum FormattingCommand {
  BOLD = 'BOLD',
  ITALIC = 'ITALIC',
  LINK = 'LINK',
  UNDERLINE = 'UNDERLINE',
  STRIKETHROUGH = 'STRIKETHROUGH',
  MONOSPACE = 'MONOSPACE',
  CODE_BLOCK = 'CODE_BLOCK',
  NEW_LINE = 'NEW_LINE'
}

// Обновленная конфигурация горячих клавиш
const HOTKEY_MAPPINGS: Record<FormattingCommand, HotkeyConfig> = {
  [FormattingCommand.BOLD]: {
    key: 'b',
    formatting: {
      startTag: '**',
      endTag: '**',
      command: 'bold',
    },
  },
  [FormattingCommand.ITALIC]: {
    key: 'i',
    formatting: {
      startTag: '*',
      endTag: '*',
      command: 'italic',
    },
  },
  [FormattingCommand.LINK]: {
    key: 'k',
    formatting: {
      startTag: '[',
      endTag: '](${url})',
      command: 'createLink',
    },
  },
  [FormattingCommand.UNDERLINE]: {
    key: 'u',
    formatting: {
      startTag: '__',
      endTag: '__',
      command: 'underline',
    },
  },
  [FormattingCommand.STRIKETHROUGH]: {
    key: 'x',
    requireShift: true,
    formatting: {
      startTag: '~~',
      endTag: '~~',
      command: 'strikeThrough',
    },
  },
  [FormattingCommand.MONOSPACE]: {
    key: 'm',
    requireShift: true,
    formatting: {
      startTag: '`',
      endTag: '`',
      command: 'formatBlock',
      // В данном случае команда будет применять моноширинный шрифт
    },
  },
  [FormattingCommand.CODE_BLOCK]: {
    key: 'n',
    requireShift: true,
    formatting: {
      startTag: '```',
      endTag: '```',
      command: 'formatBlock',
    },
  },
  [FormattingCommand.NEW_LINE]: {
    key: 'enter',
    requireShift: true,
    formatting: {
      startTag: '\n',
      endTag: '',
      command: 'insertLineBreak',
    },
  },
}

export const useKeyboardHandler = () => {
  const editorRef = useRef<HTMLDivElement | null>(null)

  const applyFormatting = (command: string, value?: string): void => {
    // Используем execCommand для применения форматирования
    document.execCommand(command, false, value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey) {
      const pressedKey = event.key.toLowerCase()

      // Ищем соответствующую команду в маппинге
      const command = Object.entries(HOTKEY_MAPPINGS).find(([_, config]) => {
        const shiftMatch = config.requireShift ? event.shiftKey : true
        return config.key === pressedKey && shiftMatch
      })

      if (command) {
        event.preventDefault()
        const [commandType, config] = command

        // Особая обработка для ссылок
        if (commandType === FormattingCommand.LINK) {
          const url = prompt('Введите URL:', 'https://')
          if (url) {
            applyFormatting(config.formatting.command, url)
          }
        }
        // Особая обработка для code и pre блоков
        else if (commandType === FormattingCommand.CODE_BLOCK) {
          applyFormatting(config.formatting.command, 'pre')
        } else if (commandType === FormattingCommand.MONOSPACE) {
          applyFormatting(config.formatting.command, 'code')
        } else {
          applyFormatting(config.formatting.command)
        }
      }
    }
  }

  useEffect(() => {
    const editor = editorRef.current
    if (editor) {
      const handleKeyDownWrapper = (e: KeyboardEvent) => {
        handleKeyDown(e as unknown as KeyboardEvent<HTMLDivElement>)
      }

      // @ts-ignore
      editor.addEventListener('keydown', handleKeyDownWrapper)
      return () => {
        // @ts-ignore
        editor.removeEventListener('keydown', handleKeyDownWrapper)
      }
    }
  }, [])

  return editorRef
}
