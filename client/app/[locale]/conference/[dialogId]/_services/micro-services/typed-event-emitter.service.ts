export class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<(data: any) => void>>()

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    const handlers = this.listeners.get(event)
    handlers?.forEach((handler) => handler(data))
  }

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    this.listeners.get(event)?.delete(handler)
  }
}
