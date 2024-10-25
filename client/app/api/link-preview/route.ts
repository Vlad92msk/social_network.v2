// app/api/link-preview/route.ts
import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 },
      )
    }

    // Получаем HTML страницы
    const response = await fetch(url, {
      // Добавляем headers чтобы уменьшить вероятность блокировки
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0;)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch page')
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Извлекаем метаданные
    const title = $('meta[property="og:title"]').attr('content')
      || $('title').text()
      || ''

    const description = $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || $('p').first().text().slice(0, 200) // Берём первый параграф как запасной вариант
      || ''

    const image = $('meta[property="og:image"]').attr('content')
      || $('meta[property="twitter:image"]').attr('content')
      || $('link[rel="image_src"]').attr('href')
      || ''

    // Нормализуем URL изображения если он относительный
    const normalizedImage = image && !image.startsWith('http')
      ? new URL(image, new URL(url).origin).toString()
      : image

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: normalizedImage,
      url,
    })
  } catch (error) {
    console.error('Error fetching link preview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 },
    )
  }
}
