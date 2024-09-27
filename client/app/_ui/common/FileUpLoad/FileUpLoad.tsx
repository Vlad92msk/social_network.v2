import React, { useCallback, useEffect, useId } from 'react'
import {
  AddedFile, availableFormats, GroupedFiles, groupFiles, MaterialAttachProps, useBooleanState, useMaterialsAttach,
} from '@hooks'
import { Button } from '@ui/common/Button'
import { Icon, IconName } from '@ui/common/Icon'
import { Modal } from '@ui/common/Modal'
import { classNames, makeCn } from '@utils/others'

import styles from './FileUpLoad.module.scss'

const cn = makeCn('FileUpLoad', styles)

type FileUpLoadProps = {
  className?: string
  icon?: IconName
  onApply?: (files: AddedFile[]) => void
  onApplyWithGroup?: (files: GroupedFiles) => void
  disabled?: boolean
  availableTypes?: MaterialAttachProps
  isConfirm?: boolean
}

export function FileUpLoad(props: FileUpLoadProps) {
  const {
    className,
    icon = 'attachment',
    disabled,
    isConfirm,
    availableTypes: { availableTypes, maxFileSize } = {
      availableTypes: availableFormats,
      maxFileSize: '1mb',
    },
    onApply,
    onApplyWithGroup,
  } = props

  const inputId = useId()
  const [addedFiles, handleAddFiles, setAddedFiles] = useMaterialsAttach({
    availableTypes, maxFileSize,
  })

  const handleAttach = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(event)
    event.target.value = '' // Очищаем значение input
  }, [handleAddFiles])

  const removeAttach = useCallback((attachName: string) => {
    setAddedFiles((prev) => prev.filter(({ name }) => name !== attachName))
  }, [setAddedFiles])

  /**
   * Модалка предпросмотра материалов
   */
  const [isOpenPevFiles, openPrevFiles, closePrevFiles] = useBooleanState(false)
  useEffect(() => {
    if (addedFiles.length) {
      // Открывает модалку если добавлен материал
      openPrevFiles()
    } else {
      // Закрывает модалку если не осталось материалов
      closePrevFiles()
    }
  }, [addedFiles, closePrevFiles, openPrevFiles])

  const applyAttachments = useCallback(() => {
    onApplyWithGroup?.(groupFiles(addedFiles))
    onApply?.(addedFiles)
    setAddedFiles([])
  }, [addedFiles, onApply, onApplyWithGroup, setAddedFiles])

  /**
   * Если не нужно вызывать модалку с подтверждением - просто добавляет файлы
   */
  useEffect(() => {
    if (!isConfirm && addedFiles.length) {
      setTimeout(() => applyAttachments(), 500)
    }
  }, [isConfirm, addedFiles, applyAttachments])

  return (
    <>
      <div className={classNames(cn(), className)}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className={cn('AddFile', { disabled })} htmlFor={inputId}>
          <Icon name="attachment" fill="grey" />
          <input
            className={cn('FileInput')}
            id={inputId}
            onInput={handleAttach}
            multiple
            accept={availableTypes.join(',')}
            type="file"
          />
        </label>
      </div>
      <Modal
        isOpen={Boolean(isOpenPevFiles && isConfirm)}
        contentClassName={cn('Content')}
      >
        <div className={cn('ApplyAttachments')}>
          {addedFiles.map(({
            name,
            src,
          }) => (
            <div key={name} className={cn('ApplyFile')}>
              <div className={cn('ImgWrapper')}>
                <img className={cn('Img')} src={src} alt={name} />
              </div>
              <Button className={cn('ButtonClose')} onClick={() => removeAttach(name)}>
                <Icon name="close" />
              </Button>
            </div>
          ))}
        </div>
        <Button className={cn('ButtonSubmit')} onClick={applyAttachments}>
          Подтвердить
        </Button>
      </Modal>
    </>
  )
}
