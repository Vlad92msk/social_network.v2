import React, { useCallback, useEffect, useId } from 'react'
import { AddedFile, availableFormats, MaterialAttachProps, useBooleanState, useMaterialsAttach } from '@hooks'
import { Icon, IconName } from 'app/_ui/common/Icon'
import { Modal, ModalOverlay } from 'app/_ui/common/Modal'
import { Button } from 'app/_ui/common/Button'
import { classNames, makeCn } from '@utils/others'

import styles from './FileUpLoad.module.scss'

const cn = makeCn('FileUpLoad', styles)

type FileUpLoadProps = {
  className?: string
  icon?: IconName
  onApply: (files: AddedFile[]) => void
  disabled?: boolean
  availableTypes?: MaterialAttachProps
  isConfirm?: boolean
}

export function FileUpLoad(props: FileUpLoadProps) {
  const {
    className,
    icon = 'attachment',
    onApply,
    disabled,
    isConfirm,
    availableTypes: { availableTypes, maxFileSize } = {
      availableTypes: availableFormats,
      maxFileSize: '1mb',
    },
  } = props

  const inputId = useId()
  const [addedFiles, handleAttach, setAddedFiles] = useMaterialsAttach({
    availableTypes, maxFileSize,
  })

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
    onApply(addedFiles)
    setAddedFiles([])
  }, [addedFiles, onApply, setAddedFiles])

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
            onChange={handleAttach}
            multiple
            accept={availableTypes.join(',')}
            type="file"
          />
        </label>
      </div>
      <Modal isOpen={Boolean(isOpenPevFiles && isConfirm)} contentClassName={cn('ApplyAttachments')}>
        <ModalOverlay />
        {addedFiles.map(({
          name,
          src,
        }) => (
          <div key={name} className={cn('ApplyImg')}>
            <div className={cn('ImgWrapper')}>
              <img className={cn('Img')} src={src} alt={name} />
            </div>
            <Button onClick={() => removeAttach(name)}>
              <Icon className={cn('CloseApply')} name="git" />
            </Button>
          </div>
        ))}
        <Button onClick={applyAttachments}>
          Подтвердить
        </Button>
      </Modal>
    </>
  )
}
