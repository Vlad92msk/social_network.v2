// RequestWithState.ts
import { createUniqueId, RequestState, RequestStateListener } from '@ui/modules/synapse/services/api'

export class RequestWithState<T> {
  private listeners = new Set<RequestStateListener<T>>();
  public id: string;
  private promise: Promise<T>;

  constructor(promise: Promise<T>) {
    this.id = createUniqueId();
    this.promise = promise;
  }

  subscribe(listener: RequestStateListener<T>): () => void {
    this.listeners.add(listener);
    this.notifyListeners({ status: 'loading' });

    // Подписываемся на результат промиса
    this.promise
      .then((result) => {
        this.notifyListeners({ status: 'success', data: result });
      })
      .catch((error) => {
        this.notifyListeners({ status: 'error', error });
      });

    return () => this.listeners.delete(listener);
  }

  private notifyListeners(state: RequestState<T>): void {
    this.listeners.forEach(listener => listener(state));
  }

  // Метод для ожидания результата
  async wait(): Promise<T> {
    return this.promise;
  }
}
