'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { MediaStreamOptions, SimpleMediaStreamService } from '@ui/components/media-stream/mediaStreamService'

export interface MediaStreamState {
  stream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface MediaStreamContextValue extends MediaStreamState {
  initialize: (options?: MediaStreamOptions) => Promise<void>;
  cleanup: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
}

const MediaStreamContext = createContext<MediaStreamContextValue | undefined>(undefined)

interface MediaStreamProviderProps {
  children: React.ReactNode;
  initialOptions?: MediaStreamOptions;
}

export function MediaStreamProvider(props: MediaStreamProviderProps) {
  const { children, initialOptions } = props
  const mediaServiceRef = useRef<SimpleMediaStreamService>(new SimpleMediaStreamService())
  const initializationRef = useRef(false)

  const [state, setState] = useState<MediaStreamState>({
    stream: undefined,
    isVideoEnabled: false,
    isAudioEnabled: false,
  })

  const updateState = () => {
    const currentState = mediaServiceRef.current.getState()
    setState({
      stream: mediaServiceRef.current.getStream(),
      isVideoEnabled: currentState.isVideoEnabled,
      isAudioEnabled: currentState.isAudioEnabled,
    })
  }

  const initialize = async (options?: MediaStreamOptions) => {
    await mediaServiceRef.current.initialize(options)
    updateState()
  }

  const cleanup = () => {
    mediaServiceRef.current.cleanup()
    updateState()
  }

  const toggleVideo = async () => {
    await mediaServiceRef.current.toggleVideo()
    updateState()
  }

  const toggleAudio = async () => {
    await mediaServiceRef.current.toggleAudio()
    updateState()
  }

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (!initializationRef.current) {
      initialize(initialOptions)
      initializationRef.current = true
    }

    return () => {
      cleanup()
      initializationRef.current = false
    }
  }, [])

  const value: MediaStreamContextValue = {
    ...state,
    initialize,
    cleanup,
    toggleVideo,
    toggleAudio,
  }

  return (
    <MediaStreamContext.Provider value={value}>
      {children}
    </MediaStreamContext.Provider>
  )
}

export const useMediaStream = () => {
  const context = useContext(MediaStreamContext)
  if (!context) {
    throw new Error('useMediaStream must be used within a MediaStreamProvider')
  }
  return context
}
