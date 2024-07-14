import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

// TODO: это временное решение лиж бы работало - потом будет заменено на нормальное получение файлов
export async function GET() {
  const mediaDirectory = path.join(process.cwd(), 'public/images/test')
  const filenames = fs.readdirSync(mediaDirectory)

  const groupedFiles: { [key: string]: any[] } = {
    image: [],
    audio: [],
    video: [],
    text: [],
    other: []
  }

  for (const filename of filenames) {
    const filePath = path.join(mediaDirectory, filename)
    const stats = fs.statSync(filePath)
    const fileBuffer = fs.readFileSync(filePath)
    const fileBlob = new Blob([fileBuffer])

    const mimeType = mime.lookup(filename) || 'application/octet-stream'
    const fileType = mimeType.split('/')[0]

    const fileObject = {
      name: filename,
      src: `/images/test/${filename}`,
      type: mimeType,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      blob: fileBlob
    }

    if (fileType in groupedFiles) {
      groupedFiles[fileType].push(fileObject)
    } else {
      groupedFiles.other.push(fileObject)
    }
  }

  return NextResponse.json(groupedFiles)
}
