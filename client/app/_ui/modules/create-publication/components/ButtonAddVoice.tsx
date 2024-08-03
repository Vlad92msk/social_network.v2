import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@ui/common/Button'
import { Icon } from '@ui/common/Icon'
import { rem, setImmutable } from '@utils/others'
import { cn } from '../cn'
import { useCreatePublicationCtxUpdate } from '../ModuleCreatePublication'

export interface VoiceMessage {
  id: string;
  blob: Blob;
  url: string;
}

export function ButtonAddVoice() {
  const update = useCreatePublicationCtxUpdate()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentAudioBlobs, setCurrentAudioBlobs] = useState<VoiceMessage[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(blob)
        const newVoiceMessage: VoiceMessage = {
          id: Date.now().toString(),
          blob,
          url: audioUrl,
        }
        setCurrentAudioBlobs((prev) => [...prev, newVoiceMessage])
        chunksRef.current = []
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }, [])

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
    }
  }, [isRecording])

  const addVoiceMessage = useCallback((voiceMessage: VoiceMessage) => {
    update((ctx) => setImmutable(ctx, 'voices', [...(ctx.voices || []), voiceMessage]))
    setCurrentAudioBlobs((prev) => prev.filter((blob) => blob.id !== voiceMessage.id))
  }, [update])

  const deleteCurrentVoiceMessage = useCallback((id: string) => {
    setCurrentAudioBlobs((prev) => prev.filter((blob) => blob.id !== id))
  }, [])



  useEffect(() => () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])

  return (
    <div className={cn('AddVoiceContainer')}>
      <div className={cn('CurrentAudioBlobs')}>
        {currentAudioBlobs.map((voiceMessage) => (
          <div key={voiceMessage.id} className={cn('CreatedVoiceMessage')}>
            <audio className={cn('CreatedVoiceMessageAudio')} src={voiceMessage.url} controls />
            <div className={cn('CreatedVoiceMessageActions')}>
              <Button className={cn('CreatedVoiceMessageButtonAdd')} onClick={() => addVoiceMessage(voiceMessage)}>
                +
              </Button>
              <Button
                className={cn('CreatedVoiceMessageButtonAdd')}
                onClick={() => deleteCurrentVoiceMessage(voiceMessage.id)}
              >
                -
              </Button>
            </div>
          </div>
        ))}
      </div>
      {!isRecording ? (
        <Button onClick={startRecording}>
          <Icon name="microphone" />
        </Button>
      ) : (
        <div style={{ display: 'flex', gap: rem(10) }}>
          <Button onClick={stopRecording}>
            ok
          </Button>
          <Button onClick={isPaused ? resumeRecording : pauseRecording}>
            <Icon name={isPaused ? 'play' : 'pause'} />
          </Button>
        </div>
      )}
    </div>
  )
}
