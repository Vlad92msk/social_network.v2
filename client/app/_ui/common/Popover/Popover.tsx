import {
  arrow, autoPlacement,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement, safePolygon,
  shift,
  Strategy,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import React, { ReactElement, ReactNode, useCallback, useRef, useState } from 'react'

// interface ReferenceProps extends Record<string, unknown> {
//   ref: (node: (ReferenceType | null)) => void
// }

interface PopoverProps {
  /**
   * Функция-рендерер для элемента, к которому будет привязан попап.
   * Она получает объект с ref и другими необходимыми свойствами.
   */
  children: ReactElement;

  /**
   * Содержимое попапа.
   */
  content: ReactNode;

  /**
   * Позиция попапа относительно целевого элемента.
   * Например: 'top', 'bottom', 'left', 'right', 'top-start', 'top-end' и т.д.
   * По умолчанию: 'bottom'
   */
  placement?: Placement;

  /**
   * Отступ попапа от целевого элемента в пикселях.
   * По умолчанию: 8
   */
  offset?: number;

  /**
   * Стратегия позиционирования: 'absolute' или 'fixed'.
   */
  strategy?: Strategy;

  /**
   * Контролируемое состояние открытия попапа.
   * Если задано, компонент становится управляемым извне.
   */
  open?: boolean;

  /**
   * Функция обратного вызова для изменения состояния открытия попапа.
   * Используется в паре с prop 'open' для создания управляемого компонента.
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Разрешает ли взаимодействие с попапом при наведении.
   * По умолчанию: true
   */
  interactive?: boolean;

  /**
   * Дополнительные стили для попапа.
   */
  floatingStyles?: React.CSSProperties;

  /**
   * Способ активации попапа: 'click', 'hover', 'focus' или 'manual'.
   * По умолчанию: 'click'
   */
  trigger?: 'click' | 'hover' | 'focus' | 'manual' | 'contextMenu';

  /**
   * Закрывать ли попап при клике вне его области.
   * По умолчанию: true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Использовать ли портал для рендеринга попапа.
   * Это может помочь с проблемами z-index и overflow.
   * По умолчанию: false
   */
  usePortal?: boolean;

  /**
   * Значение z-index для попапа.
   * По умолчанию: 1000
   */
  zIndex?: number;

  /**
   * Показывать ли стрелку для попапа.
   * По умолчанию: false
   */
  showArrow?: boolean;

  /**
   * Ширина стрелки в пикселях.
   * По умолчанию: 14
   */
  arrowWidth?: number;

  /**
   * Высота стрелки в пикселях.
   * По умолчанию: 7
   */
  arrowHeight?: number;

  /**
   * Цвет заливки стрелки.
   * По умолчанию: 'black'
   */
  arrowColor?: string;

  /**
   * Цвет обводки стрелки.
   * По умолчанию: 'none'
   */
  arrowStroke?: string;

  /**
   * Ширина обводки стрелки в пикселях.
   * По умолчанию: 0
   */
  arrowStrokeWidth?: number;

  /**
   * Радиус закругления кончика стрелки.
   * По умолчанию: 0 (острый кончик)
   */
  arrowTipRadius?: number;

  /**
   * Статическое смещение стрелки от края плавающего элемента.
   * Полезно, если плавающий элемент меньше целевого элемента и имеет выравнивание по краю.
   * По умолчанию: null (использовать динамическое положение)
   */
  arrowStaticOffset?: number | string | null;

  /**
   * Объект с настройками анимации для попапа.
   */
  animationProps?: {
    initial?: object;
    animate?: object;
    exit?: object;
    transition?: object;
  };
}

interface PopoverProps {
  children: ReactElement;
  content: ReactNode;
  placement?: Placement;
  offset?: number;
  strategy?: Strategy;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  interactive?: boolean;
  floatingStyles?: React.CSSProperties;
  trigger?: 'click' | 'hover' | 'focus' | 'manual' | 'contextMenu';
  closeOnOutsideClick?: boolean;
  usePortal?: boolean;
  zIndex?: number;
  // Arrow props
  showArrow?: boolean;
  arrowWidth?: number;
  arrowHeight?: number;
  arrowColor?: string;
  arrowStroke?: string;
  arrowStrokeWidth?: number;
  arrowTipRadius?: number;
  arrowStaticOffset?: number | string | null;
}

function useContextMenu(context) {
  const [isOpen, setIsOpen] = useState(false)

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      setIsOpen((prev) => {
        context.onOpenChange(!prev)
        return !prev
      })
    },
    [context],
  )

  return {
    getReferenceProps: () => ({
      onContextMenu: handleContextMenu,
    }),
    isOpen,
  }
}
export function Popover(props: PopoverProps) {
  const {
    children,
    content,
    placement = 'bottom',
    offset: offsetValue = 8,
    strategy: userStrategy,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    interactive = true,
    floatingStyles = {},
    trigger = 'click',
    closeOnOutsideClick = true,
    usePortal = false,
    zIndex = 1000,
    // Arrow props
    showArrow = false,
    arrowWidth = 14,
    arrowHeight = 7,
    arrowColor = 'black',
    arrowStroke = 'none',
    arrowStrokeWidth = 0,
    arrowTipRadius = 0,
    arrowStaticOffset = null,
    // animationProps = {
    //   initial: { opacity: 0, scale: 0.9 },
    //   animate: { opacity: 1, scale: 1 },
    //   exit: { opacity: 0, scale: 0.9 },
    //   transition: { duration: 0.2 },
    // },
  } = props

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  const setIsOpen = isControlled ? setControlledOpen : setUncontrolledOpen

  const arrowRef = useRef(null)

  const { refs, floatingStyles: defaultFloatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    strategy: userStrategy,
    middleware: [
      offset(offsetValue),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift(),
      showArrow && arrow({ element: arrowRef }),
    ].filter(Boolean),
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    enabled: trigger === 'hover' && interactive,
    handleClose: safePolygon(),
  })
  const focus = useFocus(context, { enabled: trigger === 'focus' })
  const dismiss = useDismiss(context, { enabled: closeOnOutsideClick })
  const role = useRole(context)
  const click = useClick(context, { enabled: trigger === 'click' })

  const contextMenu = useContextMenu(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
    click,
    // @ts-ignore
    ...(trigger === 'contextMenu' ? [contextMenu] : []),
  ])

  const popover = (
    <div
      ref={refs.setFloating}
      style={{
        ...defaultFloatingStyles,
        ...floatingStyles,
        zIndex,
        width: 'max-content',
      }}
      {...getFloatingProps()}
      // FIXME пока не рабоатет анимация - хотя тут вроде есть встроенный способ анимации - надо бы его попробовать
      // initial={animationProps.initial}
      // animate={animationProps.animate}
      // exit={animationProps.exit}
      // transition={animationProps.transition}
    >
      {content}
      {showArrow && (
        <FloatingArrow
          ref={arrowRef}
          context={context}
          width={arrowWidth}
          height={arrowHeight}
          fill={arrowColor}
          stroke={arrowStroke}
          strokeWidth={arrowStrokeWidth}
          tipRadius={arrowTipRadius}
          staticOffset={arrowStaticOffset}
        />
      )}
    </div>
  )

  return (
    <>
      {React.cloneElement(children, {
        // @ts-ignore
        ref: refs.setReference,
        ...getReferenceProps(),
        ...(trigger === 'contextMenu' ? contextMenu.getReferenceProps() : {}),
      })}
      {isOpen && (usePortal ? <FloatingPortal>{popover}</FloatingPortal> : popover)}
    </>
  )
}
