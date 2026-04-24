import { SupportedLocale } from './locales';

const PROJECT_HEADER_MESSAGE: Record<SupportedLocale, string> = {
  'en-us': 'Next',
  'es-mx': 'Siguiente',
  'pt-br': 'Proximo',
};

export function getProjectHeaderMessage(locale: SupportedLocale) {
  return PROJECT_HEADER_MESSAGE[locale];
}
