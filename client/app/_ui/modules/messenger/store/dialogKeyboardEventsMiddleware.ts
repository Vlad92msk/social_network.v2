import { AnyAction, Middleware } from '@reduxjs/toolkit'
import { RootReducer } from '../../../../../store/root.reducer'
import { MessengerSliceActions } from './messenger.slice'

/**
 * Обработка событий клавиатуры для последовательной отмены действий по клавише Escape
 */
export const dialogKeyboardEventsMiddleware: Middleware<{}, RootReducer> = (store) => (next) => (action: AnyAction) => {
  switch (action.type) {
    /**
     * Открытие/закрытие диалога
     */
    case MessengerSliceActions.setChattingPanelStatus.type: {
      if (action.payload === 'open') {
        store.dispatch(MessengerSliceActions.addUndoAction(MessengerSliceActions.setChattingPanelStatus('close')))
      } else if (action.payload === 'close') {
        const stack = store.getState().messenger.undoStack

        const lastUndoAction = stack[stack.length - 1]
        if (lastUndoAction.type === MessengerSliceActions.setChattingPanelStatus('close').type) {
          store.dispatch(MessengerSliceActions.removeLastUndoAction())
        }
      }
      break
    }

    /**
     * Открытие/закрытие информации о диалоге
     */
    case MessengerSliceActions.setInfoPanelStatus.type: {
      const panelStatus = store.getState().messenger.infoPanelStatus

      if (panelStatus === 'close') {
        store.dispatch(MessengerSliceActions.addUndoAction(MessengerSliceActions.setInfoPanelStatus()))
      } else if (panelStatus === 'open') {
        const stack = store.getState().messenger.undoStack

        const lastUndoAction = stack[stack.length - 1]
        if (lastUndoAction.type === MessengerSliceActions.setInfoPanelStatus().type) {
          store.dispatch(MessengerSliceActions.removeLastUndoAction())
        }
      }
      break
    }

    /**
     * Выполнение последнего экшена
     */
    case MessengerSliceActions.executeLastUndoAction.type: {
      // Получаем последнее действие отмены из стэка
      const state = store.getState().messenger
      const lastUndoAction = state.undoStack[state.undoStack.length - 1]
      if (lastUndoAction) {
        // Выполняем последнее действие
        store.dispatch(lastUndoAction)
      }
      break
    }

    default: return next(action)
  }

  return next(action)
}
