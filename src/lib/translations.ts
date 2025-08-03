// Simple translation system that reads from en.json
import messages from '@/i18n/messages/en.json';

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

export function useTranslations() {
  return (key: string): string => {
    return getNestedValue(messages, key) || key;
  };
}

export function getTranslations() {
  return (key: string): string => {
    return getNestedValue(messages, key) || key;
  };
}

// For server components
export async function getTranslationsAsync() {
  return (key: string): string => {
    return getNestedValue(messages, key) || key;
  };
}

// Default export for convenience
export default {
  useTranslations,
  getTranslations,
  getTranslationsAsync,
};