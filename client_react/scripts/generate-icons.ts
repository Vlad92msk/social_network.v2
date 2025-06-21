import * as fs from 'fs'
import * as path from 'path'

const ICONS_DIR = path.join(process.cwd(), 'public/_assets/icons')
const OUTPUT_DIR = path.join(process.cwd(), 'src/components/ui/icon')

// Утилита для преобразования имени файла в PascalCase
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Утилита для преобразования имени файла в camelCase
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function generateIcons() {
  // Проверяем существование директории с иконками
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons directory not found: ${ICONS_DIR}`)
    return
  }

  // Получаем все SVG файлы
  const svgFiles = fs.readdirSync(ICONS_DIR)
    .filter(file => file.endsWith('.svg'))
    .sort()

  if (svgFiles.length === 0) {
    console.warn('No SVG files found in icons directory')
    return
  }

  // Генерируем импорты
  const imports = svgFiles.map((file, index) => {
    const name = path.basename(file, '.svg')
    const pascalName = toPascalCase(name) + 'Icon'
    const relativePath = path.posix.join('../../../../public/_assets/icons', file)
    return `import ${pascalName} from '${relativePath}?react'`
  }).join('\n')

  // Генерируем объект иконок
  const iconEntries = svgFiles.map(file => {
    const name = path.basename(file, '.svg')
    const pascalName = toPascalCase(name) + 'Icon'
    return `  '${name}': ${pascalName}`
  }).join(',\n')

  // Генерируем массив имен для типов
  const iconNames = svgFiles.map(file => {
    const name = path.basename(file, '.svg')
    return `  | '${name}'`
  }).join('\n')

  // Шаблон файла icons.ts
  const iconsContent = `// This file is auto-generated. Don't edit it manually
${imports}

export const icons = {
${iconEntries}
} as const

export type IconComponent = typeof icons[keyof typeof icons]
`

  // Шаблон файла icon.model.ts
  const modelContent = `// This file is auto-generated. Don't edit it manually
export type IconName =
${iconNames}
`

  // Записываем файлы
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icons.ts'), iconsContent)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.model.ts'), modelContent)

  console.log(`✅ Generated ${svgFiles.length} icons:`)
  svgFiles.forEach(file => {
    const name = path.basename(file, '.svg')
    console.log(`   - ${name}`)
  })
}

// Запускаем генерацию
generateIcons()
