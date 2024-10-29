'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { MediaStreamOptions, SimpleMediaStreamService } from '@ui/components/media-stream/mediaStreamService'

export interface MediaStreamState {
  stream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface MediaStreamContextValue extends MediaStreamState {
  initialize: (options?: MediaStreamOptions) => Promise<void>;
  cleanup: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
}

const MediaStreamContext = createContext<MediaStreamContextValue | null>(null)

interface MediaStreamProviderProps {
  children: React.ReactNode;
  initialOptions?: MediaStreamOptions;
}

export function MediaStreamProvider({
  children,
  initialOptions,
}: MediaStreamProviderProps) {
  const mediaServiceRef = useRef<SimpleMediaStreamService>(new SimpleMediaStreamService())
  const initializationRef = useRef(false)

  const [state, setState] = useState<MediaStreamState>({
    stream: null,
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
    console.log('Initializing with options:', options)
    await mediaServiceRef.current.initialize(options)
    updateState()
  }

  const cleanup = () => {
    console.log('Cleaning up media stream...')
    mediaServiceRef.current.cleanup()
    updateState()
  }

  const toggleVideo = async () => {
    console.log('Toggling video...')
    await mediaServiceRef.current.toggleVideo()
    updateState()
  }

  const toggleAudio = async () => {
    console.log('Toggling audio...')
    await mediaServiceRef.current.toggleAudio()
    updateState()
  }

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (!initializationRef.current) {
      console.log('Initial media stream setup with options:', initialOptions)
      initialize(initialOptions)
      initializationRef.current = true
    }

    return () => {
      console.log('MediaStreamProvider cleanup')
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
