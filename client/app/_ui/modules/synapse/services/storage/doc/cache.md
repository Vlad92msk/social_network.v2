# Кэширование

Модуль кэширования позволяет сохранять результаты операций с автоматической инвалидацией по времени или тегам.

## Конфигурация

```typescript
createCacheMiddleware({
  ttl: 1000 * 60 * 30, // 30 минут - общее время жизни кэша
  cleanup: {
    enabled: true,
    interval: 1000 * 60 * 60, // 1 час - интервал очистки
  },
  invalidateOnError: true,
  rules: [
    { 
      method: 'fetchUsers', // Имя метода/функции
      tags: ['users'],
      ttl: 1000 * 60 * 5  // 5 минут для этого метода
    }
  ]
})
```

## Использование с хранилищем

```typescript
const storage = await new IndexedDBStorage({
  name: 'appStorage',
  options: {
    dbName: 'myApp',
    storeName: 'main-store',
    dbVersion: 1
  },
  middlewares: (getDefaultMiddleware) => {
    const { batching, shallowCompare } = getDefaultMiddleware()
    return [
      batching(),
      shallowCompare(),
      createCacheMiddleware({
        ttl: 1000 * 60 * 30,
        cleanup: {
          enabled: true,
          interval: 1000 * 60 * 60,
        },
        invalidateOnError: true,
        rules: [
          { 
            method: 'fetchUsers',
            tags: ['users'],
            ttl: 1000 * 60 * 5
          }
        ]
      })
    ]
  }
}).initialize()
```

## Пример использования

```typescript
// Проверяем наличие данных в кэше
const cachedUsers = await storage.get('fetchUsers_list')

if (!cachedUsers) {
  // Если данных нет - загружаем
  const users = await fetchUsers()
  // Сохраняем в кэш, используя метод как часть ключа
  await storage.set('fetchUsers_list', users)
}

// При следующем запросе в течение TTL данные будут взяты из кэша
```

## Инвалидация кэша

1. Автоматическая инвалидация по TTL:
```typescript
{
  method: 'fetchUsers',
  ttl: 1000 * 60 * 5 // Данные будут считаться устаревшими через 5 минут
}
```

2. Инвалидация по тегам:
```typescript
{
  method: 'updateUser',
  invalidateTags: ['users'] // Инвалидирует все кэши с тегом 'users'
}
```

3. Инвалидация при ошибках:
```typescript
{
  invalidateOnError: true // Инвалидация кэша при ошибках операций
}
```

## Метаданные кэша

```typescript
interface CacheMetadata {
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  accessCount: number;
  tags?: string[];
}
```

## Важные особенности

1. Ключ кэша формируется из имени метода и параметров
2. Параметр method в правилах - это имя функции или операции
3. Поддерживается вложенная структура кэша
4. Автоматическая очистка устаревших данных
5. Поддержка тегов для групповой инвалидации

## Рекомендации

1. Используйте осмысленные имена методов
2. Группируйте связанные данные с помощью тегов
3. Устанавливайте разумные значения TTL
4. Включайте автоматическую очистку для длительно работающих приложений
5. Используйте invalidateOnError для критичных данных