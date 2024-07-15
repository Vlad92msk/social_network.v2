import { useHandleDownloadFile } from '@hooks'
import { Button } from 'app/_ui/common/Button'

interface ButtonDownloadProps {
  // TODO: убрать any
  file: any
}

export function ButtonDownload(props: ButtonDownloadProps) {
  const { file } = props
  const [handleDownload, downloading] = useHandleDownloadFile()

  return (
    <Button
      onClick={() => handleDownload(file.url, file.name)}
      disabled={downloading}
      isLoading={downloading}
    >
      {file.name}
    </Button>
  )
}
