import { Icon } from '../../icon'
import { Text } from '../Text'
import { cn } from './cn'
import { useLinkPreview } from './hooks'

interface LinkPreviewProps {
  url: string
  onRemove?: () => void
}

export function LinkPreview(props: LinkPreviewProps) {
  const { url, onRemove } = props
  const { previewData, isLoading } = useLinkPreview(url)

  if (isLoading || !previewData) return null

  return (
    <div className={cn()}>
      <a className={cn('Link')} href={url} target="_blank" rel="noopener noreferrer">
        {previewData.image && (
        <div className={cn('ImageContainer')}>
          <img
            src={previewData.image}
            alt={previewData.title}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        )}
        <div className={cn('Summary')}>
          <Text fs="12" weight="bold" textElipsis>{previewData.title}</Text>
          {previewData.description && (
            <Text fs="10">{previewData.description}</Text>
          )}
        </div>
      </a>
      {onRemove && (
        <button className={cn('ButtonRemove')} onClick={onRemove}>
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}
