import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { Modal } from '@ui/common/Modal'
import { setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxUpdate } from '../CreatePublication'

export interface VideoMessage {
  id: string
  blob: Blob
  url: string
}

export function ButtonAddVideo() {
  const update = useCreatePublicationCtxUpdate()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentVideoBlobs, setCurrentVideoBlobs] = useState<VideoMessage[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node) {
        videoPreviewRef.current = node
        if (stream) {
          node.srcObject = stream
          node.play().catch((e) => console.error('Error playing video:', e))
        }
      }
    },
    [stream],
  )

  const startStream = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
    } catch (error) {
      console.error('Error accessing camera and microphone:', error)
    }
  }, [])

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
  }, [stream])

  const startRecording = useCallback(() => {
    if (!stream) return

    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const videoUrl = URL.createObjectURL(blob)
      const newVideoMessage: VideoMessage = {
        id: Date.now().toString(),
        blob,
        url: videoUrl,
      }
      setCurrentVideoBlobs((prev) => [...prev, newVideoMessage])
      chunksRef.current = []
    }

    mediaRecorder.start()
    setIsRecording(true)
    setIsPaused(false)
  }, [stream])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [isRecording])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [isPaused])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      stopStream()
    }
  }, [isRecording, stopStream])

  const addVideoMessage = useCallback(
    (videoMessage: VideoMessage) => {
      update((ctx) => setImmutable(ctx, 'videos', [...(ctx.videos || []), videoMessage]))
      setCurrentVideoBlobs((prev) => prev.filter((blob) => blob.id !== videoMessage.id))
    },
    [update],
  )

  const deleteCurrentVideoMessage = useCallback((id: string) => {
    setCurrentVideoBlobs((prev) => prev.filter((blob) => blob.id !== id))
  }, [])

  useEffect(() => {
    if (stream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = stream
      videoPreviewRef.current.play().catch((e) => console.error('Error playing video:', e))
    }
  }, [stream])

  useEffect(() => () => {
    stopStream()
  }, [stopStream])

  return (
    <div className={cn('AddVideoContainer')}>
      <Modal rootClassName={cn('ModalCreateVideo')} isOpen={Boolean(stream)}>
        <div className={cn('ModalCreateVideoWrapper')}>
          <video
            ref={setVideoRef}
            className={cn('VideoPreview')}
            muted
            playsInline
            autoPlay
          />
        </div>
        {!stream ? (
          <Button onClick={startStream}>
            <Icon name="video-camera" />
          </Button>
        ) : !isRecording ? (
          <div className={cn('ModalCreateVideoControlsRecording')}>
            <Button onClick={startRecording}>
              Start
            </Button>
            <Button onClick={stopStream}>
              Stop
            </Button>
          </div>
        ) : (
          <div className={cn('ModalCreateVideoControlsRecording')}>
            <Button onClick={stopRecording}>
              Stop Recording
            </Button>
            <Button onClick={isPaused ? resumeRecording : pauseRecording}>
              <Icon name={isPaused ? 'play' : 'pause'} />
            </Button>
          </div>
        )}
      </Modal>
      <div className={cn('CurrentVideoBlobs', { isNotEmpty: Boolean(currentVideoBlobs.length) })}>
        {currentVideoBlobs.map((videoMessage) => (
          <div key={videoMessage.id} className={cn('CurrentVideoBlobsItem')}>
            <div className={cn('CurrentVideoBlobsItemVideo')}>
              <video src={videoMessage.url} controls />
            </div>
            <div className={cn('CurrentVideoBlobsItemActions')}>
              <Button
                className={cn('CurrentVideoBlobsItemActionsButtonAdd')}
                onClick={() => addVideoMessage(videoMessage)}
              >
                +
              </Button>
              <Button
                className={cn('CurrentVideoBlobsItemActionsButtonRemove')}
                onClick={() => deleteCurrentVideoMessage(videoMessage.id)}
              >
                -
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={startStream}>
        <Icon name="video-camera" />
      </Button>
    </div>
  )
}
