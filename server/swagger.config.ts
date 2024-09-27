import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'


interface YamlGenerationConfig {
  host: string
  port: number
  directory: string
}

interface Docs {
  module: any
  url: string
  name: string
  description?: string
  version: string
}

function generateYamlFile(document: any, config: YamlGenerationConfig, moduleName: string) {
  console.log(`Начало генерации YAML файла для модуля ${moduleName}`)

  const outputDir = path.join(config.directory, moduleName)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const swaggerDoc = {
    openapi: document.openapi,
    info: document.info,
    servers: [{
      url: `http://${config.host}:${config.port}`,
      description: 'API сервер'
    }],
    tags: document.tags,
    paths: document.paths,
    components: document.components
  }

  try {
    const yamlDoc = YAML.stringify(swaggerDoc)
    const filePath = path.join(outputDir, `swagger-${moduleName}.yaml`)
    fs.writeFileSync(filePath, yamlDoc, 'utf8')
    console.log(`Создан файл: ${filePath}`)
    return filePath
  } catch (error) {
    console.error(`Ошибка при создании файла для ${moduleName}:`, error)
    return null
  }
}


function generateInterfacesFile(document: any, config: YamlGenerationConfig, moduleName: string): void {
  console.log(`Начало генерации интерфейсов для модуля ${moduleName}`)

  const outputDir = path.join(config.directory, moduleName)

  // Попытка создать директорию, если её нет
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  } catch (error) {
    console.error(`Ошибка при создании директории ${outputDir}:`, error)
    return
  }

  let interfacesContent = ''

  if (document.components && document.components.schemas) {
    for (const [name, schema] of Object.entries(document.components.schemas)) {
      interfacesContent += `export interface ${name} {\n`

      // @ts-ignore
      const requiredProps = schema.required || [] // Список обязательных свойств

      // @ts-ignore
      if (schema.properties) {
        // @ts-ignore
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const type = getTypeFromSchema(propSchema, document.components.schemas)
          interfacesContent += `  ${propName}${requiredProps.includes(propName) ? '' : '?'}: ${type}\n`
        }
      }
      interfacesContent += '}\n\n'
    }
  } else {
    console.warn(`Warning: Нет схем в components для модуля ${moduleName}`)
  }

  // Попытка записать файл интерфейсов
  try {
    const filePath = path.join(outputDir, `interfaces-${moduleName}.ts`)
    fs.writeFileSync(filePath, interfacesContent, 'utf8')
    console.log(`Создан файл интерфейсов: ${filePath}`)
  } catch (error) {
    console.error(`Ошибка при создании файла интерфейсов для ${moduleName}:`, error)
  }

  console.log(`Завершение генерации интерфейсов для модуля ${moduleName}`)
}

function getTypeFromSchema(schema: any, componentsSchemas: Record<string, any>, processedRefs: Set<string> = new Set()): string {
  if (!schema) {
    console.warn('Warning: Schema is undefined or null')
    return 'any'
  }

  if (schema.$ref) {
    const refType = schema.$ref.split('/').pop()
    if (componentsSchemas[refType]) {
      return refType!
    }
    console.warn(`Warning: Schema ${refType} not found in components.schemas`)
    return 'any'
  }

  if (schema.allOf) {
    // Объединение всех схем через allOf
    const combinedTypes = schema.allOf.map((s: any) => getTypeFromSchema(s, componentsSchemas))
    return combinedTypes.join(' & ')
  }

  if (schema.oneOf) {
    // Один из вариантов через oneOf (union type)
    const unionTypes = schema.oneOf.map((s: any) => getTypeFromSchema(s, componentsSchemas))
    return unionTypes.join(' | ')
  }

  if (Array.isArray(schema.anyOf)) {
    const unionTypes = schema.anyOf.map((s: any) => getTypeFromSchema(s, componentsSchemas, processedRefs))
    return unionTypes.join(' | ')
  }


  // Определение типа на основе схемы
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') {
        return 'Date'
      }
      if (schema.enum) {
        return schema.enum.map((e: string) => `'${e}'`).join(' | ')
      }
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'Date':
      return 'Date'
    case 'array':
      return `${getTypeFromSchema(schema.items, componentsSchemas)}[]`
    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([key, value]) =>
            `${key}${Array.isArray(schema.required) && schema.required.includes(key) ? '' : '?'}: ${getTypeFromSchema(value, componentsSchemas, processedRefs)}`
          )
          .join(' ')
        return `{ ${props} }`
      }
      return 'object'
    default:
      if (schema.type) {
        console.warn(`Неизвестный тип: ${schema.type}`)
      }
      return 'any'
  }
}


function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// =======


function generateApiClientFile(document: any, config: YamlGenerationConfig, moduleName: string) {
  console.log(`Начало генерации API-клиента для модуля ${moduleName}`)

  const outputDir = path.join(config.directory, moduleName)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let apiClientContent = ''

  // Импорт интерфейсов
  apiClientContent += `import { ${Object.keys(document.components.schemas).join(', ')} } from "./interfaces-${moduleName}"\n\n`

  // Добавляем интерфейс ExtendedApiResponse
  apiClientContent += 'interface ExtendedApiResponse<T> {\n'
  apiClientContent += '  data: T\n'
  apiClientContent += '  status: number\n'
  apiClientContent += '  statusText: string\n'
  apiClientContent += '  headers: Headers\n'
  apiClientContent += '  url: string\n'
  apiClientContent += '}\n\n'

  // Начало класса API
  apiClientContent += `export class ${capitalizeFirstLetter(moduleName)}Api {\n`
  apiClientContent += '  private baseUrl: string\n'
  apiClientContent += '  private defaultConfig: RequestInit\n\n'
  apiClientContent += '  constructor(config?: { baseUrl?: string } & RequestInit) {\n'
  apiClientContent += '    const { baseUrl, ...restConfig } = config || {}\n'
  apiClientContent += '    this.baseUrl = baseUrl || `http://${process.env.API_HOST}:${process.env.API_PORT}`\n'
  apiClientContent += '    this.defaultConfig = { headers: { \'Content-Type\': \'application/json\' }, ...restConfig }\n'
  apiClientContent += '  }\n\n'

  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const operationId = operation.operationId?.split('_').pop() || `${method}${path.replace(/\//g, '_')}`
      const parameters = operation.parameters || []
      const requestBody = operation.requestBody
      let responseType = 'any'
      if (operation.responses) {
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          if (statusCode.startsWith('2')) {
            // @ts-ignore
            const schema = response.content?.['application/json']?.schema
            if (schema) {
              responseType = getTypeFromSchema(schema, document.components.schemas)
              break
            }
          }
        }
      }

      let paramsType = ''
      if (parameters.length > 0 || requestBody) {
        const paramsList = [
          ...new Set(parameters.map(p => `${p.name}${p.required ? '' : '?'}: ${getTypeFromSchema(p.schema, document.components.schemas)}`))
        ]
        if (requestBody) {
          const contentType = Object.keys(requestBody.content || {})[0]
          if (contentType && requestBody.content[contentType].schema) {
            paramsList.push(`body: ${getTypeFromSchema(requestBody.content[contentType].schema, document.components.schemas)}`)
          } else {
            paramsList.push('body: any')
          }
        }
        paramsType = `{ ${paramsList.join(', ')} }`
      }

      apiClientContent += '  /**\n'
      apiClientContent += `   * Инициализация запроса для ${operation.summary || operationId}\n`
      apiClientContent += `   * @tags ${operation.tags?.join(', ') || ''}\n`
      apiClientContent += `   * @name ${operationId}Init\n`
      apiClientContent += '   */\n'

      apiClientContent += `  ${operationId}Init(`
      if (paramsType) {
        apiClientContent += `params: ${paramsType}, `
      }
      apiClientContent += 'requestParams?: RequestInit): { url: string, init: RequestInit } {\n'
      apiClientContent += `    const url = new URL(\`${path.replace(/{/g, '${params?.')}\`, this.baseUrl)\n`

      if (parameters.length > 0) {
        apiClientContent += '    if (params) {\n'
        apiClientContent += `      ${parameters.filter(p => p.in === 'query').map(p =>
          `if (params.${p.name} !== undefined) url.searchParams.append('${p.name}', params.${p.name}.toString())`
        ).join('\n      ')}\n`
        apiClientContent += '    }\n'
      }

      apiClientContent += '    let body: string | undefined | FormData\n'
      apiClientContent += '    let headers = { ...this.defaultConfig?.headers, ...requestParams?.headers }\n'

      if (requestBody) {
        apiClientContent += '    // @ts-ignore\n'
        apiClientContent += '    if (params?.body instanceof FormData) {\n'
        apiClientContent += '      body = params.body\n'
        apiClientContent += '      delete headers[\'Content-Type\']\n'
        apiClientContent += '    } else if (params?.body) {\n'
        apiClientContent += '      body = JSON.stringify(params.body)\n'
        apiClientContent += '      headers[\'Content-Type\'] = \'application/json\'\n'
        apiClientContent += '    }\n'
      }

      apiClientContent += '    const init: RequestInit = {\n'
      apiClientContent += `      method: '${method.toUpperCase()}',\n`
      apiClientContent += '      ...this.defaultConfig,\n'
      apiClientContent += '      body,\n'
      apiClientContent += '      ...requestParams,\n'
      apiClientContent += '      headers,\n'
      apiClientContent += '    }\n'
      apiClientContent += '    return { url: url.toString(), init }\n'
      apiClientContent += '  }\n\n'

      apiClientContent += '  /**\n'
      apiClientContent += `   * ${operation.summary || 'Нет описания'}\n`
      apiClientContent += `   * @tags ${operation.tags?.join(', ') || ''}\n`
      apiClientContent += `   * @name ${operationId}\n`
      apiClientContent += `   * @request ${method.toUpperCase()}:${path}\n`
      apiClientContent += `   * @response \`200\` \`${responseType}\` OK\n`
      apiClientContent += '   */\n'

      apiClientContent += `  async ${operationId}(`
      if (paramsType) {
        apiClientContent += `params: ${paramsType}, `
      }
      apiClientContent += `requestParams?: RequestInit): Promise<${responseType}> {\n`
      apiClientContent += `    const { url, init } = this.${operationId}Init(${paramsType ? 'params, ' : ''}requestParams)\n`
      apiClientContent += '    const response = await fetch(url, init)\n'
      apiClientContent += '    if (!response.ok) {\n'
      apiClientContent += '      throw new Error(`HTTP error! status: ${response.status}`)\n'
      apiClientContent += '    }\n'
      apiClientContent += '    return await response.json()\n'
      apiClientContent += '  }\n\n'

      apiClientContent += '  /**\n'
      apiClientContent += `   * ${operation.summary || 'Нет описания'} (с расширенным ответом)\n`
      apiClientContent += `   * @tags ${operation.tags?.join(', ') || ''}\n`
      apiClientContent += `   * @name ${operationId}Extended\n`
      apiClientContent += `   * @request ${method.toUpperCase()}:${path}\n`
      apiClientContent += `   * @response \`200\` \`ExtendedApiResponse<${responseType}>\` OK\n`
      apiClientContent += '   */\n'

      apiClientContent += `  async ${operationId}Extended(`
      if (paramsType) {
        apiClientContent += `params: ${paramsType}, `
      }
      apiClientContent += `requestParams?: RequestInit): Promise<ExtendedApiResponse<${responseType}>> {\n`
      apiClientContent += `    const { url, init } = this.${operationId}Init(${paramsType ? 'params, ' : ''}requestParams)\n`
      apiClientContent += '    const response = await fetch(url, init)\n'
      apiClientContent += '    const data = await response.json()\n'
      apiClientContent += `    const result: ExtendedApiResponse<${responseType}> = {\n`
      apiClientContent += '      data,\n'
      apiClientContent += '      status: response.status,\n'
      apiClientContent += '      statusText: response.statusText,\n'
      apiClientContent += '      headers: response.headers,\n'
      apiClientContent += '      url: response.url\n'
      apiClientContent += '    }\n'
      apiClientContent += '    if (!response.ok) {\n'
      apiClientContent += '      throw result\n'
      apiClientContent += '    }\n'
      apiClientContent += '    return result\n'
      apiClientContent += '  }\n\n'
    }
  }
  apiClientContent += '}\n'

  try {
    const filePath = path.join(outputDir, `api-client-${moduleName}.ts`)
    fs.writeFileSync(filePath, apiClientContent, 'utf8')
    console.log(`Создан файл API-клиента: ${filePath}`)
  } catch (error) {
    console.error(`Ошибка при создании файла API-клиента для ${moduleName}:`, error)
  }

  console.log(`Завершение генерации API-клиента для модуля ${moduleName}`)
}



export async function setupSwagger(app: INestApplication, config: YamlGenerationConfig, docs: Docs[]) {
  console.log('Начало настройки Swagger')
  const result = []

  for (const doc of docs) {
    const options = new DocumentBuilder()
      .setTitle(doc.name)
      .setDescription(doc.description)
      .setVersion(doc.version)
      .addTag(doc.url)
      .build()

    const document = SwaggerModule.createDocument(app, options, {
      include: [doc.module],
    })

    const url = `docs/${doc.url}`
    SwaggerModule.setup(url, app, document)

    const yamlFilePath = generateYamlFile(document, config, doc.url)
    if (yamlFilePath) {
        generateInterfacesFile(document, config, doc.url)
      generateApiClientFile(document, config, doc.url)
        result.push(`${doc.name}: http://${config.host}:${config.port}/${url}`)
    }
  }

  console.log('Swagger настройка завершена')
  return result
}
