'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { MediaStreamManager, MediaStreamOptions } from './media-stream.service'

const MediaStreamContext = createContext<MediaStreamManager | null>(null)

interface MediaStreamProviderProps {
  children: React.ReactNode
  options?: MediaStreamOptions
  autoStart?: boolean
}

export function MediaStreamProvider({ children, options, autoStart = true }: MediaStreamProviderProps) {
  const manager = useRef<MediaStreamManager>(new MediaStreamManager(options))

  useEffect(() => {
    if (options) {
      manager.current?.destroy()
      manager.current = new MediaStreamManager(options)
    }

    return () => {
      manager.current?.destroy()
    }
  }, [options])

  useEffect(() => {
    if (autoStart && manager.current) {
      manager.current.startStream()
    }
  }, [autoStart])

  return (
    <MediaStreamContext.Provider value={manager.current}>
      {children}
    </MediaStreamContext.Provider>
  )
}


export function useMediaStreamContext() {
  const manager = useContext(MediaStreamContext)
  if (!manager) {
    throw new Error('useMediaStreamContext must be used within MediaStreamProvider')
  }

  const [state, setState] = useState(manager.getState())

  useEffect(() => manager.subscribe(setState), [manager])

  return {
    stream: state.stream,
    isVideoEnabled: state.isVideoEnabled,
    isAudioEnabled: state.isAudioEnabled,
    error: state.error,
    toggleVideo: () => manager.toggleVideo(),
    toggleAudio: () => manager.toggleAudio(),
    startStream: () => manager.startStream(),
    stopStream: () => manager.stopStream(),
  }
}
