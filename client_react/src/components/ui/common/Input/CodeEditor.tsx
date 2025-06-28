import React, { useCallback, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { classNames } from '@utils'

import { cn } from './cn'

export type CodeLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'cpp' | 'csharp'

interface CodeEditorProps {
  value: string
  language: CodeLanguage
  onChange: (value: string) => void
  onModeSwitch: VoidFunction
  className?: string
  readOnly?: boolean
}

export function CodeEditor(props: CodeEditorProps) {
  const { value, language, onChange, onModeSwitch, className, readOnly } = props
  const editorRef = useRef<any>(null)

  // Функция для обновления размера редактора
  const updateEditorHeight = useCallback(() => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const contentHeight = Math.min(
      100,
      Math.max(
        100,
        // Количество строк * высота строки + отступы
        editor.getModel().getLineCount() * 20 + 40,
      ),
    )

    // Обновляем контейнер
    const container = editor.getContainerDomNode()
    container.style.height = `${contentHeight}px`

    // Пересчитываем app-layout
    editor.layout()
  }, [])

  // Обновляем размер при изменении значения
  useEffect(() => {
    if (editorRef.current) {
      updateEditorHeight()
    }
  }, [value, updateEditorHeight])

  return (
    <div className={classNames(cn('CodeEditor'), className)}>
      <Editor
        className={cn('CodeEditorContent')}
        height="100%"
        language={language}
        value={value}
        onChange={(value) => {
          onChange(value || '')
        }}
        onMount={(editor) => {
          editorRef.current = editor
          updateEditorHeight()
        }}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          readOnly,
          overviewRulerLanes: 0,
          automaticLayout: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'hidden',
          },
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          glyphMargin: false,
          folding: false,
          contextmenu: false,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  )
}
