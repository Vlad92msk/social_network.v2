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

Давайте разберем каждый модификатор доступа и использование static:

```typescript
class Example {
  // PUBLIC - доступно везде
  public name: string;             // Явно указываем public
  lastName: string;               // По умолчанию тоже public
  
  // PRIVATE - доступно только внутри класса
  private secretKey: string;      // Недоступно снаружи класса
  #modernPrivate: string;        // Новый синтаксис приватных полей в JS/TS
  
  // PROTECTED - доступно внутри класса и его наследников
  protected age: number;          // Доступно в этом классе и классах-наследниках
  
  // STATIC - принадлежит классу, а не экземпляру
  static counter: number = 0;     // Общее для всех экземпляров
  
  // Примеры методов
  public getName(): string {
    return this.name;
  }
  
  private generateSecretKey(): string {
    return Math.random().toString();
  }
  
  protected validateAge(age: number): boolean {
    return age > 0;
  }
  
  static createInstance(): Example {
    return new Example();
  }
}
```

### 1. public
```typescript
class User {
  public name: string;
  
  public getName(): string {
    return this.name;
  }
}

const user = new User();
user.name = "John";      // Можно обращаться снаружи
user.getName();          // Можно вызывать снаружи
```
- Доступно отовсюду
- Значение по умолчанию в TypeScript
- Используется для публичного API класса

### 2. private
```typescript
class User {
  private password: string;
  
  private hashPassword(): string {
    // Внутренняя логика
    return "hashed_" + this.password;
  }
}

const user = new User();
user.password;           // Ошибка! Нельзя обращаться снаружи
user.hashPassword();     // Ошибка! Нельзя вызывать снаружи
```
- Доступно только внутри класса
- Используется для внутренней реализации
- Защищает данные от внешнего доступа

### 3. protected
```typescript
class Animal {
  protected age: number;
  
  protected validateAge(age: number): boolean {
    return age > 0;
  }
}

class Dog extends Animal {
  setAge(age: number) {
    if (this.validateAge(age)) {  // Можно использовать в наследнике
      this.age = age;             // Можно обращаться в наследнике
    }
  }
}

const dog = new Dog();
dog.age;                // Ошибка! Нельзя обращаться снаружи
dog.validateAge(5);     // Ошибка! Нельзя вызывать снаружи
```
- Доступно в классе и его наследниках
- Используется для общей логики в иерархии классов
- Защищает данные, но позволяет наследникам их использовать

### 4. static
```typescript
class Database {
  private static instance: Database;
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  static readonly CONNECTION_TIMEOUT = 5000;
}

const db = Database.getInstance();  // Вызов без создания экземпляра
console.log(Database.CONNECTION_TIMEOUT);  // Доступ к константе
```
- Принадлежит классу, а не экземпляру
- Можно использовать без создания экземпляра
- Используется для:
    - Фабричных методов
    - Утилитных функций
    - Констант
    - Кэширования
    - Паттерна Singleton

### Когда что использовать:

1. **public** для:
    - Методов и свойств, которые являются частью API класса
    - Когда свойство/метод нужно использовать снаружи класса

2. **private** для:
    - Внутренней реализации
    - Данных, которые не должны быть доступны извне
    - Вспомогательных методов

3. **protected** для:
    - Методов и свойств, которые нужны наследникам
    - Общей логики в иерархии классов
    - Когда нужно позволить наследникам переопределить поведение

4. **static** для:
    - Утилитных методов
    - Фабричных методов
    - Констант
    - Кэширования
    - Когда нужна общая функциональность без создания экземпляра

### Практический пример:
```typescript
class StorageService {
  // Статическая константа
  static readonly DEFAULT_TIMEOUT = 1000;
  
  // Приватные поля для внутреннего использования
  private connection: Connection;
  private cache: Map<string, any>;
  
  // Защищенные методы для наследников
  protected async validateConnection(): boolean {
    return this.connection.isAlive();
  }
  
  // Публичный API
  public async getData(key: string): Promise<any> {
    if (await this.validateConnection()) {
      return this.connection.get(key);
    }
  }
}
```
