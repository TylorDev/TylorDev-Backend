function normalizeDigits(input: string) {
  return input.replace(/\d+/g, (match) => match.padStart(2, '0'));
}

export function createBaseSlug(title: string) {
  const normalized = normalizeDigits(title.trim())
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

  return normalized || 'item';
}

export function createSlugSuffix() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const number = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${letter}${number}`;
}

export function getPrimaryTitle(
  translations: Array<{
    locale: string;
    title: string;
  }>,
) {
  const preferredOrder = ['en-us', 'es-mx', 'pt-br'];

  for (const locale of preferredOrder) {
    const match = translations.find((translation) => translation.locale === locale && translation.title.trim());
    if (match) {
      return match.title;
    }
  }

  return translations.find((translation) => translation.title.trim())?.title ?? 'item';
}
