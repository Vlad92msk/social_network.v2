import { ContentBlock } from 'draft-js'

interface CodeBlockProps {
  block: ContentBlock
}

// Компонент для отображения кода
export const CodeComponent = ({ block }: CodeBlockProps) => {
  const text = block.getText()

  return (
    <div className="relative">
      <pre
        className="rounded-lg p-4 my-2 overflow-auto"
        style={{
          backgroundColor: 'rgb(40, 44, 52)',
          color: '#fff',
          margin: '0.5em 0',
        }}
      >
        <code
          className="font-mono text-sm"
          style={{
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </code>
      </pre>
    </div>
  )
}

export const blockRendererFn = (contentBlock: ContentBlock) => {
  if (contentBlock.getType() === 'code-block') {
    return {
      component: CodeComponent,
      props: {
        block: contentBlock,
      },
      editable: true,
    }
  }
  return null
}
