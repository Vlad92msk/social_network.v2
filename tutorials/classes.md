## abstract class
### Отличия абстрактного класса:

- Нельзя создать экземпляр абстрактного класса напрямую (нельзя написать new BaseWebRTCService())
- Предназначен для наследования другими классами
- Может содержать абстрактные методы, которые обязательно должны быть реализованы в дочерних классах
- Служит как шаблон для других классов


### protected vs private

```typescript
class Example {
  private privateVar = 'private';     // Доступно только внутри этого класса
  protected protectedVar = 'protected'; // Доступно внутри этого класса и всех его наследников
}

class Child extends Example {
  someMethod() {
    console.log(this.protectedVar);  // ОК - protected доступен в наследнике
    console.log(this.privateVar);    // Ошибка - private недоступен в наследнике
  }
}
```

- private - доступно только внутри класса, где объявлено
- protected - доступно внутри класса и всех его наследников
- Оба модификатора скрывают данные от внешнего кода


### override:

- Показывает, что метод переопределяет метод родительского класса
- Помогает избежать ошибок (если вы пытаетесь переопределить метод, которого нет в родительском классе, TypeScript выдаст ошибку)
- Улучшает читаемость кода - явно видно, что метод унаследован и изменен
- Это часть TypeScript, в JavaScript на выполнение не влияет

Пример использования всего вместе в нашем коде:
```typescript
abstract class BaseWebRTCService {
  protected config: WebRTCConfig;  // protected - доступно наследникам
  private listeners = new Set();   // private - только для этого класса

  abstract handleConnection(): void;  // абстрактный метод - должен быть реализован наследниками

    setLocalStream(stream?: MediaStream) {
    // базовая реализация
    }
}

class WebRTCManager extends BaseWebRTCService {
    constructor(config: WebRTCConfig, sendSignal: Function) {
      super(config, sendSignal);  // обязательный вызов super при наличии конструктора
    }

    override setLocalStream(stream?: MediaStream) {  // переопределяем метод родителя
     super.setLocalStream(stream);  // вызываем родительскую реализацию
     // дополнительная логика
    }

  handleConnection() {  // реализуем абстрактный метод
    // реализация
  }
}

```
