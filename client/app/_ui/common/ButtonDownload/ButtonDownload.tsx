import { useHandleDownloadFile } from '@hooks'
import { Button } from 'app/_ui/common/Button'

interface ButtonDownloadProps {
  // TODO: убрать any
  file: any
}

export function ButtonDownload(props: ButtonDownloadProps) {
  const { file } = props
  const [handleDownload, downloading] = useHandleDownloadFile()
console.log('ButtonDownload', file)
  return (
    <Button
      onClick={() => handleDownload(file.meta.src, file.meta.name)}
      disabled={downloading}
      isLoading={downloading}
    >
      {file.meta.name}
    </Button>
  )
}
