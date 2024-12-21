'use client'

import React, { useEffect } from 'react'

interface CodeBlockProps {
  children?: React.ReactNode
}

export function CodeBlock(props: CodeBlockProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Prism) {
      window.Prism.highlightAll()
    }
  }, [props.children])

  return (
    <pre
      className="language-typescript rounded-lg"
      style={{
        background: 'rgb(40, 44, 52)',
        margin: '0.5em 0px',
        padding: '1em',
      }}
    >
      <code>
        {props.children}
      </code>
    </pre>
  )
}
