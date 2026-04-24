export const SUPPORTED_LOCALES = ['en-us', 'es-mx', 'pt-br'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
