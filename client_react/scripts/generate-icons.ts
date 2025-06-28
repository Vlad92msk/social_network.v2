import * as fs from 'fs'
import * as path from 'path'

// Пути для новой структуры
const ICONS_DIR = path.join(process.cwd(), 'src/assets/icons')
const OUTPUT_DIR = path.join(process.cwd(), 'src/components/ui/common/icon')

// Утилита для преобразования имени файла в PascalCase
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Утилита для создания директории если её нет
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Created directory: ${dirPath}`)
  }
}

function generateIcons() {
  console.log('🚀 Starting icon generation...\n')

  // Проверяем существование директории с иконками
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`❌ Icons directory not found: ${ICONS_DIR}`)
    console.log('💡 Please create the directory and add SVG files:')
    console.log('   mkdir -p src/assets/icons')
    console.log('   # Add your .svg files to src/assets/icons/')
    return
  }

  // Убеждаемся что выходная директория существует
  ensureDirectoryExists(OUTPUT_DIR)

  // Получаем все SVG файлы
  const svgFiles = fs.readdirSync(ICONS_DIR)
    .filter(file => file.endsWith('.svg'))
    .sort()

  if (svgFiles.length === 0) {
    console.warn('⚠️  No SVG files found in icons directory')
    console.log(`📍 Looking in: ${ICONS_DIR}`)
    return
  }

  console.log(`📦 Found ${svgFiles.length} SVG files:`)
  svgFiles.forEach(file => console.log(`   • ${file}`))
  console.log('')

  // Генерируем импорты
  const imports = svgFiles.map((file) => {
    const name = path.basename(file, '.svg')
    const pascalName = toPascalCase(name) + 'Icon'
    // Относительный путь от src/app-components/ui/Icon/ к src/assets/icons/
    const relativePath = `../../../../assets/icons/${file}`
    return `import ${pascalName} from '${relativePath}?react'`
  }).join('\n')

  // Генерируем объект иконок
  const iconEntries = svgFiles.map(file => {
    const name = path.basename(file, '.svg')
    const pascalName = toPascalCase(name) + 'Icon'
    return `  '${name}': ${pascalName}`
  }).join(',\n')

  // Генерируем типы для имен иконок
  const iconNames = svgFiles.map(file => {
    const name = path.basename(file, '.svg')
    return `  | '${name}'`
  }).join('\n')

  // Шаблон файла icons.ts
  const iconsContent = `// This file is auto-generated. Don't edit it manually
// Generated from: src/assets/icons/
// Last updated: ${new Date().toISOString()}

${imports}

export const icons = {
${iconEntries}
} as const

export type IconComponent = typeof icons[keyof typeof icons]
`

  // Шаблон файла icon.model.ts
  const modelContent = `// This file is auto-generated. Don't edit it manually
// Generated from: src/assets/icons/
// Last updated: ${new Date().toISOString()}

export type IconName =
${iconNames}
`

  // Записываем файлы
  const iconsPath = path.join(OUTPUT_DIR, 'icons.ts')
  const modelPath = path.join(OUTPUT_DIR, 'icon.model.ts')

  fs.writeFileSync(iconsPath, iconsContent)
  fs.writeFileSync(modelPath, modelContent)

  console.log('✅ Successfully generated icon files:')
  console.log(`   📄 ${path.relative(process.cwd(), iconsPath)}`)
  console.log(`   📄 ${path.relative(process.cwd(), modelPath)}`)
  console.log('')
  console.log('🎯 Available icons:')
  svgFiles.forEach(file => {
    const name = path.basename(file, '.svg')
    console.log(`   • <Icon name="${name}" />`)
  })
  console.log('')
  console.log('🔥 Ready to use in your app-components!')
}

// Запускаем генерацию
generateIcons()
