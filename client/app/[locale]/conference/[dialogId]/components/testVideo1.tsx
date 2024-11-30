// VideoChat.tsx

'use client'

import { cloneDeep } from 'lodash'
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './testVideo1.module.scss'
import { MediaStreamManager, MediaStreamState } from '../web-rtc/micro-services'

export function VideoChatTest() {
  const serviceRef = useRef<MediaStreamManager | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<MediaStreamState>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [devices, setDevices] = useState<{ video: MediaDeviceInfo[], audio: MediaDeviceInfo[] }>()
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    setShowPlaceholder(!state?.stream || !state.hasVideo);
  }, [state?.stream, state?.hasVideo]);

  const updateVideoStream = useCallback((stream: MediaStream | null) => {
    if (videoRef.current) {
      if (stream !== videoRef.current.srcObject) {
        videoRef.current.srcObject = null // Сначала очищаем
        videoRef.current.srcObject = stream // Затем устанавливаем новый поток
        if (stream) {
          // Дожидаемся загрузки метаданных перед воспроизведением
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error)
          }
        }
      }
    }
  }, [])

  const loadDevices = useCallback(async () => {
    if (serviceRef.current) {
      const deviceList = await serviceRef.current.getAvailableDevices()
      setDevices(deviceList)
    }
  }, [])

  const handleStateChange = useCallback((newState: MediaStreamState) => {
    setState(cloneDeep(newState))
    updateVideoStream(newState.stream)
    const tracks = newState.stream?.getTracks()
    console.clear()
    console.log('tracks', tracks)
  }, [updateVideoStream, setState])

  useEffect(() => {
    const service = new MediaStreamManager()
    serviceRef.current = service

    service.init({
      video: false,
      audio: false,
      echoCancellation: true,
      noiseSuppression: true,
    }).then(() => {
      service.on('stateChanged', handleStateChange)
      service.on('error', console.error)
      service.on('deviceChange', loadDevices)
      loadDevices()
    })

    return () => {
      service.destroy()
      serviceRef.current = null
    }
  }, [handleStateChange, loadDevices])

  const toggleMedia = useCallback(async (type: 'video' | 'audio') => {
    if (!serviceRef.current || isLoading) return

    setIsLoading(true)
    try {
      const isEnabled = type === 'video' ? state?.isVideoEnabled : state?.isAudioEnabled
      const method = type === 'video'
        ? isEnabled ? 'disableVideo' : 'enableVideo'
        : isEnabled ? 'disableAudio' : 'enableAudio'

      await serviceRef.current[method]()
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, state])

  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.video}
          style={{ display: showPlaceholder ? 'none' : 'block' }}
        />
        {showPlaceholder && (
          <div className={styles.placeholder}>
            Нет видеопотока
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.mainControls}>
          <button
            onClick={() => toggleMedia('video')}
            disabled={isLoading}
            className={styles.controlButton}
          >
            {state?.isVideoEnabled ? <Video/> : <VideoOff/>}
          </button>

          <button
            onClick={() => toggleMedia('audio')}
            disabled={isLoading}
            className={styles.controlButton}
          >
            {state?.isAudioEnabled ? <Mic/> : <MicOff/>}
          </button>

          <button
            onClick={() => (state?.isAudioMuted
              ? serviceRef.current?.unmuteAudio()
              : serviceRef.current?.muteAudio())}
            disabled={!state?.isAudioEnabled}
            className={styles.controlButton}
          >
            {state?.isAudioMuted ? <VolumeX/> : <Volume2/>}
          </button>
        </div>

        <div className={styles.deviceControls}>
          <select
            onChange={(e) => serviceRef.current?.switchVideoDevice(e.target.value)}
            disabled={!state?.isVideoEnabled}
            value={state?.currentVideoDevice || ''}
            className={styles.select}
          >
            {devices?.video.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Камера ${device.deviceId}`}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => serviceRef.current?.switchAudioDevice(e.target.value)}
            disabled={!state?.isAudioEnabled}
            value={state?.currentAudioDevice || ''}
            className={styles.select}
          >
            {devices?.audio.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Микрофон ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.volumeControl}>
          <label className={styles.volumeLabel}>
            Громкость:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={state?.volume || 0}
              onChange={(e) => serviceRef.current?.setVolume(parseFloat(e.target.value))}
              className={styles.volumeSlider}
              disabled={!state?.isAudioEnabled}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
