```mermaid
classDiagram
    class IPlugin {
        <<interface>>
        +name: string
        +initialize()? Promise~void~
        +destroy()? Promise~void~
    }
    note for IPlugin "Базовый интерфейс плагина:
    - name: уникальный идентификатор
    - initialize?: опциональная асинхронная инициализация
    - destroy?: опциональное освобождение ресурсов"

    class IPluginManager~T~ {
        <<interface>>
        +add(plugin T)* Promise~void~
        +remove(name string)* Promise~void~
        +get(name string)* T|undefined
        +getAll()* T[]
        +initialize()* Promise~void~
        +destroy()* Promise~void~
    }
    note for IPluginManager "Generic интерфейс менеджера плагинов:
    T - тип управляемых плагинов
    Управляет жизненным циклом:
    - Добавление/удаление
    - Получение по имени
    - Инициализация/уничтожение"

    class IEventBus {
        <<interface>>
        +createSegment(name string, options object)
        +emit(event IEvent) Promise~void~
    }
    note for IEventBus "Шина событий:
    - Создание сегментов событий
    - Отправка уведомлений
    - Асинхронная обработка"

    class ILogger {
        <<interface>>
        +warn(message string, ...args any[])
        +error(message string, error Error)
    }

    class IStoragePlugin {
        <<interface>>
        +onBeforeSet~T~(key string, value T)? T
        +onAfterSet~T~(key string, value T)? void
        +onBeforeGet(key string)? string
        +onAfterGet~T~(key string, value T|undefined)? T|undefined
        +onBeforeDelete(key string)? boolean
        +onAfterDelete(key string)? void
        +onClear()? void
    }
    note for IStoragePlugin "Плагин хранилища:
    Опциональные хуки для операций:
    - Установка значений (до/после)
    - Получение значений (до/после)
    - Удаление (до/после)
    - Очистка хранилища"

    class StoragePluginManager {
        -plugins Map~string, IStoragePlugin~
        -eventBus IEventBus
        -logger ILogger
        +constructor(eventBus, logger)
        +add(plugin IStoragePlugin) Promise~void~
        +remove(name string) Promise~void~
        +get(name string) IStoragePlugin|undefined
        +getAll() IStoragePlugin[]
        +initialize() Promise~void~
        +destroy() Promise~void~
        +executeBeforeSet~T~(key string, value T) T
        +executeAfterSet~T~(key string, value T) void
        +executeBeforeGet(key string) string
        +executeAfterGet~T~(key string, value T|undefined) T|undefined
        +executeBeforeDelete(key string) boolean
        +executeAfterDelete(key string) void
        +executeOnClear() void
    }

    IPlugin <|-- IStoragePlugin : extends
    IPluginManager <|.. StoragePluginManager : implements
    StoragePluginManager --> IStoragePlugin : manages T
    StoragePluginManager --> IEventBus : uses
    StoragePluginManager --> ILogger : uses
```
