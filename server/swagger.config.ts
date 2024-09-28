import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { uniqBy } from 'lodash'
import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'

interface YamlGenerationConfig {
  host: string;
  port: number;
  directory: string;
}

interface Docs {
  module: any;
  url: string;
  name: string;
  description?: string;
  version: string;
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
      const requiredProps = schema.required || []

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
    const combinedTypes = schema.allOf.map((s: any) => getTypeFromSchema(s, componentsSchemas))
    return combinedTypes.join(' & ')
  }

  if (schema.oneOf) {
    const unionTypes = schema.oneOf.map((s: any) => getTypeFromSchema(s, componentsSchemas))
    return unionTypes.join(' | ')
  }

  if (Array.isArray(schema.anyOf)) {
    const unionTypes = schema.anyOf.map((s: any) => getTypeFromSchema(s, componentsSchemas, processedRefs))
    return unionTypes.join(' | ')
  }

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
          .join(', ')
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
  apiClientContent += 'export interface ExtendedApiResponse<T> {\n  data: T\n  status: number\n  statusText: string\n  headers: Headers\n  url: string\n}\n\n'

  // Генерация интерфейсов параметров
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const operationId = operation.operationId?.split('_').pop() || `${method}${path.replace(/\//g, '_')}`
      const parameters = uniqBy(operation.parameters, 'name')
      const requestBody = operation.requestBody

      const paramsInterfaceName = `${capitalizeFirstLetter(operationId)}Params`
      apiClientContent += `export interface ${paramsInterfaceName} {\n`
      parameters.forEach(p => {
        // @ts-ignore
        apiClientContent += `  ${p.name}${p.required ? '' : '?'}: ${getTypeFromSchema(p.schema, document.components.schemas)};\n`
      })
      if (requestBody) {
        const contentType = Object.keys(requestBody.content || {})[0]
        if (contentType && requestBody.content[contentType].schema) {
          apiClientContent += `  body: ${getTypeFromSchema(requestBody.content[contentType].schema, document.components.schemas)};\n`
        } else {
          apiClientContent += '  body: any;\n'
        }
      }
      apiClientContent += '}\n\n'
    }
  }

  // Начало класса API
  apiClientContent += `export class ${capitalizeFirstLetter(moduleName)}Api {\n`
  apiClientContent += '  private baseUrl: string;\n'
  apiClientContent += '  private defaultConfig: RequestInit;\n\n'
  apiClientContent += '  constructor(config?: { baseUrl?: string } & RequestInit) {\n'
  apiClientContent += '    const { baseUrl, ...restConfig } = config || {};\n'
  apiClientContent += '    this.baseUrl = baseUrl || `http://${process.env.API_HOST}:${process.env.API_PORT}`;\n'
  apiClientContent += '    this.defaultConfig = { headers: { \'Content-Type\': \'application/json\' }, ...restConfig };\n'
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

      const paramsInterfaceName = `${capitalizeFirstLetter(operationId)}Params`

      apiClientContent += generateInitMethod(operationId, paramsInterfaceName, path, method, parameters, requestBody, operation)
      apiClientContent += generateMainMethod(operationId, paramsInterfaceName, responseType, method, path, operation)
      apiClientContent += generateExtendedMethod(operationId, paramsInterfaceName, responseType, method, path, operation)
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

function generateInitMethod(operationId: string, paramsType: string, path: string, method: string, parameters: any[], requestBody: any, operation: any) {
  let content = ''
  content += '  /**\n'
  content += `   * Инициализация запроса для ${operation.summary || operationId}\n`
  content += `   * @tags ${operation.tags?.join(', ') || ''}\n`
  content += `   * @name ${operationId}Init\n`
  content += '   */\n'
  content += `  ${operationId}Init(params: ${paramsType}, requestParams?: RequestInit): { url: string, init: RequestInit } {\n`
  content += `    const url = new URL(\`${path}\`, this.baseUrl);\n`
  if (parameters.length > 0) {
    content += '    Object.entries(params).forEach(([key, value]) => {\n'
    content += '      if (value !== undefined) {\n'
    content += '        if (Array.isArray(value)) {\n'
    content += '          url.searchParams.append(key, value.join(\',\'));\n'
    content += '        } else {\n'
    content += '          url.searchParams.append(key, value.toString());\n'
    content += '        }\n'
    content += '      }\n'
    content += '    });\n'
  }
  content += '    const headers = { ...this.defaultConfig?.headers, ...requestParams?.headers };\n'
  content += '    let body: string | undefined | FormData;\n'
  if (requestBody) {
    content += '    if (params.body instanceof FormData) {\n'
    content += '      body = params.body;\n'
    content += '      delete headers[\'Content-Type\'];\n'
    content += '    } else if (params.body) {\n'
    content += '      body = JSON.stringify(params.body);\n'
    content += '      headers[\'Content-Type\'] = \'application/json\';\n'
    content += '    }\n'
  }
  content += '    const init: RequestInit = {\n'
  content += `      method: '${method.toUpperCase()}',\n`
  content += '      ...this.defaultConfig,\n'
  content += '      body,\n'
  content += '      ...requestParams,\n'
  content += '      headers,\n'
  content += '    };\n'
  content += '    return { url: url.toString(), init };\n'
  content += '  }\n\n'
  return content
}

function generateMainMethod(operationId: string, paramsType: string, responseType: string, method: string, path: string, operation: any) {
  let content = ''
  content += '  /**\n'
  content += `   * ${operation.summary || 'Нет описания'}\n`
  content += `   * @tags ${operation.tags?.join(', ') || ''}\n`
  content += `   * @name ${operationId}\n`
  content += `   * @request ${method.toUpperCase()}:${path}\n`
  content += `   * @response \`200\` \`${responseType}\` OK\n`
  content += '   */\n'
  content += `  async ${operationId}(params: ${paramsType}, requestParams?: RequestInit): Promise<${responseType}> {\n`
  content += `    const { url, init } = this.${operationId}Init(params, requestParams);\n`
  content += '    const response = await fetch(url, init);\n'
  content += '    if (!response.ok) {\n'
  content += '      throw new Error(`HTTP error! status: ${response.status}`);\n'
  content += '    }\n'
  content += '    return await response.json();\n'
  content += '  }\n\n'
  return content
}

function generateExtendedMethod(operationId: string, paramsType: string, responseType: string, method: string, path: string, operation: any) {
  let content = ''
  content += '  /**\n'
  content += `   * ${operation.summary || 'Нет описания'} (с расширенным ответом)\n`
  content += `   * @tags ${operation.tags?.join(', ') || ''}\n`
  content += `   * @name ${operationId}Extended\n`
  content += `   * @request ${method.toUpperCase()}:${path}\n`
  content += `   * @response \`200\` \`ExtendedApiResponse<${responseType}>\` OK\n`
  content += '   */\n'
  content += `  async ${operationId}Extended(params: ${paramsType}, requestParams?: RequestInit): Promise<ExtendedApiResponse<${responseType}>> {\n`
  content += `    const { url, init } = this.${operationId}Init(params, requestParams);\n`
  content += '    const response = await fetch(url, init);\n'
  content += '    const data = await response.json();\n'
  content += `    const result: ExtendedApiResponse<${responseType}> = {\n`
  content += '      data,\n'
  content += '      status: response.status,\n'
  content += '      statusText: response.statusText,\n'
  content += '      headers: response.headers,\n'
  content += '      url: response.url\n'
  content += '    };\n'
  content += '    if (!response.ok) {\n'
  content += '      throw result;\n'
  content += '    }\n'
  content += '    return result;\n'
  content += '  }\n\n'
  return content
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
