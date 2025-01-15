Давайте разберем по порядку:

1. **Почему "коллекторы"?**
- Название "коллектор" происходит от их основной функции - они "собирают" (collect) логи и направляют их в разные места
- Это не совсем паттерн Адаптер, скорее это паттерн Observer/Strategy:
    - Logger - это subject (наблюдаемый объект)
    - Коллекторы - это observers (наблюдатели)
    - Каждый коллектор реализует свою стратегию обработки логов

2. **EventBusLogger и функционал:**
```typescript
// 1. Создаем базовый Logger
const logger = new Logger()

// 2. Создаем EventBus
const eventBus = new SegmentedEventBus()

// 3. Создаем коллектор для EventBus
const eventBusCollector = new EventBusLogger(eventBus)

// 4. Добавляем коллектор к логгеру
logger.addCollector(eventBusCollector)
```

Когда мы делаем `logger.addCollector(eventBusCollector)`, мы не расширяем функционал logger'а, а добавляем новый способ обработки логов.

3. **Почему не используем eventBusCollector.subscribe?**
- `eventBusCollector` - это только "мост" между Logger и EventBus
- Он только публикует (publish) логи в EventBus
- Для подписки мы используем сам EventBus:
```typescript
// Неправильно:
eventBusCollector.subscribe(...) // У коллектора нет метода subscribe

// Правильно:
eventBus.subscribe('logger', (event) => {
  // Обработка лога
})
```

Схематично это выглядит так:
```
Logger ---(log)---> EventBusCollector ---(publish)---> EventBus ---(notify)---> Subscribers
```

Другими словами:
1. Logger создает лог
2. EventBusCollector получает лог и публикует его в EventBus
3. EventBus доставляет лог всем подписчикам

Поэтому для подписки на логи мы используем EventBus, а не коллектор.

Давайте на простых примерах:

```typescript
// 1. Базовое использование Logger с консольным выводом
const logger = new Logger()
logger.addCollector(new ConsoleLogCollector())

logger.info('Hello')  // Выведет в консоль: [INFO] Hello
logger.error('Error') // Выведет в консоль: [ERROR] Error


// 2. Использование Logger с EventBus
const logger = new Logger()
const eventBus = new SegmentedEventBus()
const eventBusCollector = new EventBusLogger(eventBus)

// Добавляем коллекторы
logger.addCollector(new ConsoleLogCollector())
logger.addCollector(eventBusCollector)

// Подписываемся на логи через EventBus
eventBus.subscribe('logger', (event) => {
  // event.payload это LogEntry { level, message, timestamp, data? }
  if (event.payload.level === LogLevel.ERROR) {
    sendToSlack(event.payload)
  }
})

// Теперь при вызове:
logger.error('Something went wrong')
// 1. Выведется в консоль через ConsoleLogCollector
// 2. Отправится в Slack через подписчика EventBus


// 3. Комплексный пример
const logger = new Logger()
const eventBus = new SegmentedEventBus()

// Добавляем разные коллекторы
logger.addCollector(new ConsoleLogCollector())
logger.addCollector(new FileLogCollector('app.log'))
logger.addCollector(new EventBusLogger(eventBus))

// Подписываемся на разные уровни логов
eventBus.subscribe('logger', (event) => {
  switch(event.payload.level) {
    case LogLevel.ERROR:
      sendToSlack(event.payload)
      break
    case LogLevel.INFO:
      saveToAnalytics(event.payload)
      break
  }
})

// Один вызов - много обработчиков
logger.error('Database connection failed', { dbName: 'main' })
// 1. Выведется в консоль
// 2. Запишется в файл
// 3. Отправится в Slack
```

У Logger нет метода `subscribe` - он только генерирует логи и передает их коллекторам. Подписка на логи происходит через EventBus, если нам нужно реагировать на логи в других частях приложения.

тоесть мы дополняем функционал eventBus возможностями логгера?

Не совсем. Давайте посмотрим на это с другой стороны:

1. **Logger** - это основной сервис для логирования. Он:
- Создает логи
- Передает их коллекторам
```typescript
const logger = new Logger()
logger.info('Hello') // создает лог и передает коллекторам
```

2. **EventBus** - это система обмена событиями. Она:
- Принимает события
- Распространяет их подписчикам
```typescript
const eventBus = new SegmentedEventBus()
eventBus.publish(event) // публикует событие
eventBus.subscribe('channel', handler) // подписывается на события
```

3. **EventBusLogger (коллектор)** - это "мост" между ними. Он:
- Принимает логи от Logger
- Преобразует их в события
- Отправляет в EventBus
```typescript
const eventBusCollector = new EventBusLogger(eventBus)
logger.addCollector(eventBusCollector) // теперь логи будут попадать в EventBus
```

То есть мы не дополняем EventBus, а делаем так, чтобы логи из Logger попадали в систему событий EventBus.

Схема работы:
```
1. logger.info('Hello')  →  2. EventBusLogger.collect()  →  3. eventBus.publish()  →  4. eventBus.subscribers
```

Да, именно! Это один из главных плюсов такой архитектуры. Давайте рассмотрим пример:

```typescript
const eventBus = new SegmentedEventBus()
const logger = new Logger()
        .addCollector(new ConsoleLogCollector())
        .addCollector(new FileLogCollector('app.log'))
        .addCollector(new EventBusLogger(eventBus))

// После настройки регистрируем в DI
container.register('eventBus', eventBus)
container.register('logger', logger)


// Сервисы
@Injectable()
class UserService {
  constructor(
    private logger: Logger // инжектируем logger
  ) {}

  createUser(data: UserData) {
    this.logger.info('User created', { data })
  }
}

@Injectable()
class NotificationService {
  constructor(
    private eventBus: SegmentedEventBus // инжектируем eventBus
  ) {
    // Подписываемся на все логи о создании пользователей
    this.eventBus.subscribe('logger', (event) => {
      if (
        event.payload.message === 'User created' && 
        event.payload.data
      ) {
        this.sendWelcomeEmail(event.payload.data)
      }
    })
  }

  private sendWelcomeEmail(userData: UserData) {
    // Отправка email
  }
}
```

В этом примере:
1. UserService ничего не знает о NotificationService
2. Сервисы не связаны напрямую
3. Коммуникация происходит через логи и EventBus
4. Можно добавлять новых подписчиков без изменения существующего кода

Это пример слабого связывания (loose coupling) через систему событий.
