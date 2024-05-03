import { ModalContent, ModalOverlay } from '@chakra-ui/react'
import React, { useCallback, useEffect, useId } from 'react'
import { AddedFile, availableFormats, MaterialAttachProps, useBooleanState, useMaterialsAttach } from '@hooks'
import { IconBase, IconName } from '@ui/base/IconBase'
import { ModalBase } from '@ui/base/Modal'
import { ButtonCommon } from '@ui/common/ButtonCommon'
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
          <IconBase name="attachment" fill="grey" />
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
      <ModalBase isOpen={Boolean(isOpenPevFiles && isConfirm)} onClose={() => 1}>
        <ModalOverlay />
        <ModalContent>
          <div className={cn('ApplyAttachments')}>
            {addedFiles.map(({
              name,
              src,
            }) => (
              <div key={name} className={cn('ApplyImg')}>
                <div className={cn('ImgWrapper')}>
                  <img className={cn('Img')} src={src} alt={name} />
                </div>
                <ButtonCommon onClick={() => removeAttach(name)}>
                  <IconBase className={cn('CloseApply')} name="git" />
                </ButtonCommon>
              </div>
            ))}
          </div>
          <ButtonCommon onClick={applyAttachments}>
            Подтвердить
          </ButtonCommon>
        </ModalContent>
      </ModalBase>
    </>
  )
}
