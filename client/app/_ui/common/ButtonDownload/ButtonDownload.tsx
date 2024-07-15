import { useHandleDownloadFile } from '@hooks'
import { ButtonCommon } from '@ui/common/ButtonCommon'

interface ButtonDownloadProps {
  // TODO: убрать any
  file: any
}

export function ButtonDownload(props: ButtonDownloadProps) {
  const { file } = props
  const [handleDownload, downloading] = useHandleDownloadFile()

  return (
    <ButtonCommon
      onClick={() => handleDownload(file.url, file.name)}
      disabled={downloading}
      isLoading={downloading}
    >
      {file.name}
    </ButtonCommon>
  )
}
