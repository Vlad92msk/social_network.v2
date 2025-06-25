/**
 * Регистр изображений - центральное место для управления всеми изображениями проекта
 */

/**
 * Vite: Автоматическое получение всех изображений из папки assets/images
 */
const imageModules = import.meta.glob('/src/assets/images/**/*.{png,jpg,jpeg,webp,avif,gif,svg}', {
  eager: true,
  as: 'url'
});

/**
 * Обработка путей и создание карты изображений
 */
export const images = Object.entries(imageModules).reduce(
  (acc, [path, url]) => {
    // Убираем '/src/assets/images/' в начале и получаем относительный путь
    const relativePath = path.replace('/src/assets/images/', '');

    // Путь без расширения
    const keyWithoutExt = relativePath.replace(/\.(png|jpe?g|webp|avif|gif|svg)$/i, '');

    return {
      ...acc,
      [keyWithoutExt]: url as string,
      [relativePath]: url as string, // Также сохраняем с расширением
    };
  },
  {} as Record<string, string>,
);

/**
 * Получает URL изображения по пути
 */
export const getImageSrc = (imagePath: string): string | null => {
  return images[imagePath] || null;
};

/**
 * Получает WebP версию изображения
 */
export const getWebpImageSrc = (imagePath: string): string | null => {
  const webpPath = `${imagePath}.webp`;
  return images[webpPath] || null;
};

/**
 * Получает AVIF версию изображения
 */
export const getAvifImageSrc = (imagePath: string): string | null => {
  const avifPath = `${imagePath}.avif`;
  return images[avifPath] || null;
};

/**
 * Получает SVG версию изображения
 */
export const getSvgImageSrc = (imagePath: string): string | null => {
  const svgPath = `${imagePath}.svg`;
  return images[svgPath] || null;
};

/**
 * Получает информацию о доступных форматах изображения
 */
export const getImageFormats = (imagePath: string) => {
  return {
    avif: getAvifImageSrc(imagePath),
    webp: getWebpImageSrc(imagePath),
    svg: getSvgImageSrc(imagePath),
    main: getImageSrc(imagePath),
  };
};

/**
 * Отладка - показывает все доступные изображения
 */
export const debugImages = () => {
  console.group('🖼️ Image Registry Debug');
  console.log('Total files found:', Object.keys(imageModules).length);
  console.log('Processed keys:', Object.keys(images).filter(key => !key.includes('.')).length);
  console.log('Available images:', Object.keys(images).filter(key => !key.includes('.')));
  console.log('Full registry:', images);
  console.groupEnd();
};
