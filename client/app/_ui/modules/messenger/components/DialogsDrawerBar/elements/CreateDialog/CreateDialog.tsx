import { Button } from '@ui/common/Button'
import { makeCn } from '@utils/others'
import style from './CreateDialog.module.scss'
import { dialogsApi } from '../../../../../../../../store/api'

export const cn = makeCn('CreateDialog', style)

export function CreateDialog() {
  const [onCreateDialog] = dialogsApi.useCreateMutation()

  return (
    <Button
      className={cn()}
      onClick={() => {
        onCreateDialog({ body: {} })
      }}
    >
      Создать диалог
    </Button>
  )
}
