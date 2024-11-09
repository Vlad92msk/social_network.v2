// Сервис уведомлений
import { EventEmitter } from 'events'

export class NotificationManager extends EventEmitter {
  private notifications: Map<string, string> = new Map()

  notify(type: string, message: string) {
    const id = crypto.randomUUID()
    this.notifications.set(id, message)
    console.log('NOTIFICATION', type, message)
    this.emit('notification', { id, type, message })

    // Автоматическое удаление уведомления через 5 секунд
    setTimeout(() => {
      this.removeNotification(id)
    }, 5000)
  }

  removeNotification(id: string) {
    if (this.notifications.has(id)) {
      this.notifications.delete(id)
      this.emit('notificationRemoved', id)
    }
  }
}
