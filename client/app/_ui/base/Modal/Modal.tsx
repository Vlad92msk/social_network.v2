import {
  Modal as ChakraModal,
  // ModalOverlay,
  // ModalContent,
  // ModalHeader,
  // ModalFooter,
  // ModalBody,
  // ModalCloseButton,
  ModalProps as ModalChakraProps,
} from '@chakra-ui/react'

export interface ModalBaseProps extends ModalChakraProps {
  className?: string
}

export function ModalBase(props: ModalBaseProps) {
  return <ChakraModal {...props} />
}
