import { useHandleDownloadFile } from '@hooks'

import { Button } from '../Button'

interface ButtonDownloadProps {
  // TODO: убрать any
  file: any
}

export function ButtonDownload(props: ButtonDownloadProps) {
  const { file } = props
  const [handleDownload, downloading] = useHandleDownloadFile()

  return (
    <Button onClick={() => handleDownload(file.meta.src, file.meta.name)} disabled={downloading} isLoading={downloading}>
      {file.meta.name}
    </Button>
  )
}
