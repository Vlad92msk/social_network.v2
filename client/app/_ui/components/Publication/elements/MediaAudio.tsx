import { cn } from '@ui/components/Publication/cn'

interface Audio {
  type: string
  src: string
  name: string
}

interface MediaAudioProps {
  audios: Audio[]
}

export function MediaAudio(props: MediaAudioProps) {
  const { audios } = props

  return (
    <div className={cn('MediaContainerAudioList')}>
      {audios.map(({ src, type }) => (
        <audio key={src} controls>
          <source src={src} type={type} />
          Your browser does not support the audio element.
        </audio>
      ))}
    </div>
  )
}
