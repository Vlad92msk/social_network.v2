const fs = require('fs')
const path = require('path')

const iconsDir = path.join(process.cwd(), 'app', '_assets', 'icons')
const files = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'))

// Генерируем типы
const iconTypes = files
  .map(file => `  | '${file.replace('.svg', '')}'`)
  .join('\n')

const iconModelContent = `export type IconName =\n${iconTypes}\n`

// Генерируем импорты и маппинг иконок
const imports = files
  .map((file, index) => `import SVG${index} from '../../../_assets/icons/${file}'`)
  .join('\n')

const iconMapping = files
  .map((file, index) => {
    const name = file.replace('.svg', '')
    const propertyName = name.replace(/-./g, x => x[1].toUpperCase())
    return `  '${name}': SVG${index}`
  })
  .join(',\n')

const iconsContent = `// This file is auto-generated. Don't edit it manually
${imports}

export const icons = {
${iconMapping}
} as const

export type IconComponent = typeof icons[keyof typeof icons]
`

fs.writeFileSync(
  path.join(process.cwd(), 'app', '_ui', 'common', 'Icon', 'icon.model.ts'),
  iconModelContent
)

fs.writeFileSync(
  path.join(process.cwd(), 'app', '_ui', 'common', 'Icon', 'icons.ts'),
  iconsContent
)

console.log('Icon types and imports generated successfully!')
