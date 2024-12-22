import {
  CompositeDecorator,
  ContentBlock,
  convertFromRaw,
  convertToRaw,
  DraftDecorator, DraftHandleValue,
  EditorState,
} from 'draft-js'
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

interface EditorConfig {
  decorators?: DraftDecorator[]
  plugins?: EditorPlugin[]
  spellCheck?: boolean
  maxLength?: number
}

export interface EditorPlugin {
  onChange?: (editorState: EditorState) => EditorState
  handleKeyCommand?: (command: string, editorState: EditorState) => DraftHandleValue | EditorState
  keyBindingFn?: (e: KeyboardEvent<Element>) => string | null
  handleReturn?: (e: KeyboardEvent<Element>, editorState: EditorState) => DraftHandleValue
}

interface EditorCallbacks {
  onTextChange?: (text: string) => void
  onStateChange?: (state: EditorState) => void
  onError?: (error: Error) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  typingDelay?: number
}

interface UseEditorStateResult {
  editorState: EditorState
  setEditorState: (state: EditorState) => void
  setText: (text: string) => void
  getText: () => string
  getPlainText: () => string
  clearContent: () => void
  hasText: () => boolean
  config: EditorConfig
  updateConfig: (newConfig: Partial<EditorConfig>) => void
}

function createEmptyRawContent(text: string) {
  return {
    blocks: [
      {
        key: new ContentBlock().getKey(),
        text,
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
    entityMap: {},
  }
}

function createCompositeDecorator(decorators: DraftDecorator[]): CompositeDecorator {
  return new CompositeDecorator(decorators)
}

function createEditorState(text?: string, config?: EditorConfig): EditorState {
  let editorState: EditorState

  if (!text) {
    editorState = EditorState.createEmpty(
      config?.decorators ? createCompositeDecorator(config.decorators) : undefined,
    )
  } else {
    try {
      const rawContent = JSON.parse(text)
      const contentState = convertFromRaw(rawContent)
      editorState = EditorState.createWithContent(
        contentState,
        config?.decorators ? createCompositeDecorator(config.decorators) : undefined,
      )
    } catch {
      const rawContent = createEmptyRawContent(text)
      editorState = EditorState.createWithContent(
        convertFromRaw(rawContent),
        config?.decorators ? createCompositeDecorator(config.decorators) : undefined,
      )
    }
  }

  // Apply plugins initial state modifications
  if (config?.plugins) {
    config.plugins.forEach((plugin) => {
      if (plugin.onChange) {
        editorState = plugin.onChange(editorState)
      }
    })
  }

  return editorState
}

export function useEditorState(
  initialText?: string,
  // eslint-disable-next-line default-param-last
  initialConfig: EditorConfig = {},
  callbacks?: EditorCallbacks,
): UseEditorStateResult {
  const [config, setConfig] = useState<EditorConfig>(initialConfig)
  const [editorState, setEditorState] = useState(() => createEditorState(initialText, config))
  const typingTimeoutRef = useRef<NodeJS.Timeout>(undefined)

  const setText = useCallback((text: string) => {
    setEditorState(createEditorState(text, config))
  }, [config])

  const getText = useCallback(() => {
    const contentState = editorState.getCurrentContent()
    return JSON.stringify(convertToRaw(contentState))
  }, [editorState])

  const getPlainText = useCallback(() => {
    const contentState = editorState.getCurrentContent()
    return contentState.getPlainText()
  }, [editorState])

  const clearContent = useCallback(() => {
    setEditorState(createEditorState('', config))
  }, [config])

  const hasText = useCallback(() => {
    const contentState = editorState.getCurrentContent()
    return contentState.hasText()
  }, [editorState])

  const updateConfig = useCallback((newConfig: Partial<EditorConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }))
  }, [])

  const handleTyping = useCallback(() => {
    const text = getText()
    callbacks?.onTextChange?.(text)
    callbacks?.onStartTyping?.()

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      callbacks?.onStopTyping?.()
    }, callbacks?.typingDelay || 1500)
  }, [callbacks, getText])

  // Handle plugin modifications
  const handleStateChange = useCallback((newState: EditorState) => {
    let modifiedState = newState

    try {
      if (config.plugins) {
        config.plugins.forEach((plugin) => {
          if (plugin.onChange) {
            modifiedState = plugin.onChange(modifiedState)
          }
        })
      }

      if (config.maxLength) {
        const currentContent = modifiedState.getCurrentContent()
        const currentLength = currentContent.getPlainText('').length

        if (currentLength > config.maxLength) {
          return // Prevent update if exceeds maxLength
        }
      }

      setEditorState(modifiedState)
      callbacks?.onStateChange?.(modifiedState)

      // Вызываем handleTyping при изменении состояния
      handleTyping()
    } catch (error) {
      callbacks?.onError?.(error as Error)
    }
  }, [config, callbacks, handleTyping])

  // Очистка таймера при размонтировании
  useEffect(() => () => {
    clearTimeout(typingTimeoutRef.current)
  }, [])

  // Handle initialText changes
  useEffect(() => {
    if (initialText) {
      const newState = createEditorState(initialText, config)
      setEditorState(newState)
    }
  }, [initialText, config])

  // Recreate editor state when decorators change
  useEffect(() => {
    const currentContent = editorState.getCurrentContent()
    const newState = EditorState.createWithContent(
      currentContent,
      config.decorators ? createCompositeDecorator(config.decorators) : undefined,
    )
    setEditorState(newState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.decorators])

  return {
    editorState,
    setEditorState: handleStateChange,
    setText,
    getText,
    getPlainText,
    clearContent,
    hasText,
    config,
    updateConfig,
  }
}

// Вспомогательная функция для конвертации EditorState в строку
export function editorStateToString(editorState: EditorState): string {
  const contentState = editorState.getCurrentContent()
  return JSON.stringify(convertToRaw(contentState))
}

export function editorStateFromString(str?: string) {
  return createEditorState(str)
}

export function editorStateToPlainText(editorState: EditorState): string {
  const contentState = editorState.getCurrentContent()
  return contentState.getPlainText()
}
