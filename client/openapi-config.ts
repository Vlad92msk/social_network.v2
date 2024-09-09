import type { ConfigFile } from '@rtk-query/codegen-openapi'
import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'yaml'

const swaggerDir = path.join(__dirname, '../swagger')
const outputDir = path.join(__dirname, 'app/_store/generated')

// Функция для создания директории, если она не существует
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

ensureDirectoryExistence(outputDir)

const modules = fs.readdirSync(swaggerDir).filter(file =>
    fs.statSync(path.join(swaggerDir, file)).isDirectory()
)

const outputFiles = modules.reduce((acc, module) => {
    const yamlPath = path.join(swaggerDir, module, `swagger-${module}.yaml`)
    const yamlContent = fs.readFileSync(yamlPath, 'utf8')
    const yamlData = YAML.parse(yamlContent)
    const baseUrl = yamlData.servers[0]?.url || '/'

    const moduleOutputDir = path.join(outputDir, module)
    ensureDirectoryExistence(moduleOutputDir)
    ensureDirectoryExistence(path.join(moduleOutputDir, 'apis'))

    acc[path.join(moduleOutputDir, 'types.ts')] = {
        schemaFile: yamlPath,
        apiFile: '../../emptyApi.ts',
        apiImport: 'emptySplitApi',
        outputFile: path.join(moduleOutputDir, 'types.ts'),
        exportName: `${module}Types`,
        hooks: false,
        tag: false,
    }

    acc[path.join(moduleOutputDir, 'apis', `${module}Api.ts`)] = {
        schemaFile: yamlPath,
        apiFile: '../../../emptyApi.ts',
        apiImport: 'emptySplitApi',
        outputFile: path.join(moduleOutputDir, 'apis', `${module}Api.ts`),
        exportName: `${module}Api`,
        hooks: true,
        tag: true,
        filterEndpoints: new RegExp(module, 'i'),
        apiBaseQuery: {
            baseUrl: baseUrl,
        },
        extraOptions: {
            tagTypes: [module],
        },
        custom: {
            addTagTypes: `export const addTagTypes = ['${module}'] as const;`,
            injectEndpoints: `
                .injectEndpoints({
                    endpoints: (build) => ({
                        // endpoints will be generated here
                    }),
                    overrideExisting: false,
                })
            `,
            customApiExport: `
                export const ${module}Api = injectedRtkApi.enhanceEndpoints({
                    addTagTypes: ['${module}'],
                });
                ${module}Api.reducerPath = '${module}Api';
            `,
        },
    }

    return acc
}, {})

const config: ConfigFile = {
    schemaFile: 'dummy',
    apiFile: './app/_store/emptyApi.ts',
    apiImport: 'emptySplitApi',
    outputFiles,
    hooks: true,
}

export default config
