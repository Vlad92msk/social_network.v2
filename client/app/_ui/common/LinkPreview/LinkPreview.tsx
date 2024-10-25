import { useLinkPreview } from './hooks/useLinkPreview'

interface LinkPreviewProps {
  url: string
}

export function LinkPreviewComponent(props: LinkPreviewProps) {
  const { url } = props
  const { previewData, isLoading } = useLinkPreview(url)

  if (isLoading || !previewData) return null

  return (
    <div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div>
          {previewData.image && (
            <div>
              <img
                src={previewData.image}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          <div>
            <h3>
              {previewData.title}
            </h3>
            {previewData.description && (
              <p>
                {previewData.description}
              </p>
            )}
            <p>
              {url}
            </p>
          </div>
        </div>
      </a>
    </div>
  )
}
