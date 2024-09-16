import * as fs from 'fs'
import * as path from 'path'

// Путь, куда будут сохраняться сгенерированные файлы
const OUTPUT_DIR = path.join(__dirname, 'store', 'generated')

// Путь к папке swagger
const SWAGGER_DIR = path.join(__dirname, '../swagger')

// Вспомогательная функция для извлечения типа из Promise и обработки сложных типов
const extractAndFormatType = (type: string) => {
  // Удаляем Promise<...>, если он есть
  const withoutPromise = type.replace(/Promise<(.+)>/, '$1').trim()

  // Обрабатываем массивы
  if (withoutPromise.startsWith('Array<') || withoutPromise.startsWith('array<')) {
    return withoutPromise.replace(/Array<(.+)>/, '$1[]').replace(/array<(.+)>/, '$1[]')
  }

  // Возвращаем тип как есть, если это не массив
  return withoutPromise
}

// Шаблон для генерации файлов API
const API_TEMPLATE = (apiName: string, className: string, methods: Array<{ name: string, type: string, returnType: string }>, imports: string[]) => `
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieType } from '../../app/types/cookie';
import { RootState } from '../store'
import { ${apiName}ApiInstance } from '../../store/instance';
import { ${imports.join(', ')} } from '../../../swagger/${apiName}/interfaces-${apiName}';

export const ${apiName}Api = createApi({
  reducerPath: 'API_${apiName}',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const profileId = state.profile?.profile?.id;
      const userInfoId = state.profile?.profile?.user_info?.id;

      if (profileId) {
        headers.set(CookieType.USER_PROFILE_ID, String(profileId));
      }
      if (userInfoId) {
        headers.set(CookieType.USER_INFO_ID, String(userInfoId));
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    ${methods.map(({ name, type, returnType }) => `
    ${name}: builder.${type}<
      ${returnType},
      Parameters<typeof ${apiName}ApiInstance.${name}>[0]
    >({
      query: (params) => {
        const { url, init } = ${apiName}ApiInstance.${name}Init(params);
        return { url, ...init };
      },
    }),`).join('\n')}
  }),
});
`

function generateApiFile(apiName: string) {
  const apiClientFile = path.join(SWAGGER_DIR, apiName, `api-client-${apiName}.ts`)
  const interfacesFile = path.join(SWAGGER_DIR, apiName, `interfaces-${apiName}.ts`)

  if (!fs.existsSync(apiClientFile) || !fs.existsSync(interfacesFile)) {
    console.error(`API client file or interfaces file not found for ${apiName}`)
    return
  }

  const apiClientContent = fs.readFileSync(apiClientFile, 'utf-8')
  const interfacesContent = fs.readFileSync(interfacesFile, 'utf-8')

  const className = apiClientContent.match(/export class (\w+)/)?.[1]

  if (!className) {
    console.error(`Could not find class name in ${apiClientFile}`)
    return
  }

  const methodRegex = /async\s+(\w+)(?<!Extended|Init)\s*\([^)]*\)\s*:\s*Promise<([^>]+)>/g
  const methods = []
  let match

  while ((match = methodRegex.exec(apiClientContent)) !== null) {
    const [, name, returnType] = match
    console.log('Найден метод:', name, 'с типом возврата:', returnType)
    if (!name.endsWith('Extended') && !name.endsWith('Init')) {
      const type = name.startsWith('get') || name.startsWith('find') ? 'query' : 'mutation'
      // @ts-ignore
      methods.push({ name, type, returnType: extractAndFormatType(returnType) })
    }
  }

  // Извлекаем все экспортируемые интерфейсы из файла интерфейсов
  const interfaceRegex = /export\s+(?:interface|type|enum)\s+(\w+)/g
  const imports = []
  while ((match = interfaceRegex.exec(interfacesContent)) !== null) {
    // @ts-ignore
    imports.push(match[1])
  }

  const code = API_TEMPLATE(apiName, className, methods, imports)

  const outputFile = path.join(OUTPUT_DIR, `${apiName}.api.ts`)
  fs.writeFileSync(outputFile, code)
  console.log(`Generated ${outputFile}`)
}

// Создаем выходную директорию, если она не существует
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function generateIndexFile(apis: string[]) {
  const indexContent = apis.map((api) => `export * from './${api}.api';`).join('\n')
  const indexFile = path.join(OUTPUT_DIR, 'index.ts')
  fs.writeFileSync(indexFile, indexContent)
  console.log(`Generated ${indexFile}`)
}

// Получаем список всех API из папки swagger
const apis = fs.readdirSync(SWAGGER_DIR).filter(file => fs.statSync(path.join(SWAGGER_DIR, file)).isDirectory())

// Генерируем файлы для каждого API
apis.forEach(generateApiFile)

// Генерируем index.ts
generateIndexFile(apis)

console.log('API generation completed.')
