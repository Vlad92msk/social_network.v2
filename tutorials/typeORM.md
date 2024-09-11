
### Обновление данных

- Если вам нужно обновить только определенные поля и сохранить существующие связи, **preload** - хороший выбор.
- Если производительность критична и вам не нужно проверять существующие данные перед обновлением, используйте **update**.
- Если вам нужна дополнительная логика или проверки перед обновлением, подход с **findOne** и ручным обновлением может быть более подходящим.
-Для сложных обновлений или специфических условий, **QueryBuilder** предоставляет наибольшую гибкость.

#### Поиск тегов, содержащих "tech" в имени
````typescript
import { Like } from "typeorm";

const techTags = await tagRepository.find({
    where: {
        name: Like("%tech%")
    }
});
````

#### Поиск тегов, начинающихся с "pro"
```typescript
const proTags = await tagRepository.find({
    where: {
        name: Like("pro%")
    }
});
```

#### Поиск тегов с трехбуквенными именами, начинающимися на "a"
```typescript
const shortATags = await tagRepository.find({
    where: {
    name: Like("a__")
    }
});
```