import {
  CompositeDecorator,
  ContentBlock,
  convertFromRaw,
  convertToRaw,
  EditorState,
} from 'draft-js'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseEditorStateResult {
  editorState: EditorState
  setEditorState: (state: EditorState) => void
  setText: (text: string) => void
  getText: () => string
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

export function createEditorState(
  text?: string,
  decorator?: CompositeDecorator,
): EditorState {
  if (!text) {
    return decorator
      ? EditorState.createEmpty(decorator)
      : EditorState.createEmpty()
  }

  try {
    const rawContent = JSON.parse(text)
    const contentState = convertFromRaw(rawContent)
    return decorator
      ? EditorState.createWithContent(contentState, decorator)
      : EditorState.createWithContent(contentState)
  } catch {
    const rawContent = createEmptyRawContent(text)
    return decorator
      ? EditorState.createWithContent(convertFromRaw(rawContent), decorator)
      : EditorState.createWithContent(convertFromRaw(rawContent))
  }
}

export function useEditorState(
  initialText?: string,
  decorator?: CompositeDecorator,
): UseEditorStateResult {
  const [editorState, setEditorState] = useState(() => createEditorState(initialText, decorator))

  const setText = useCallback((text: string) => {
    setEditorState(createEditorState(text))
  }, [])

  const getText = useCallback(() => {
    const contentState = editorState.getCurrentContent()
    return JSON.stringify(convertToRaw(contentState))
  }, [editorState])

  return {
    editorState,
    setEditorState,
    setText,
    getText,
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
