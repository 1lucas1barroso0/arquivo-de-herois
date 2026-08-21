import type { AppLanguage } from "./localization";

const technicalPatterns = [
  /can't access property/i,
  /cannot read propert/i,
  /is undefined/i,
  /is not a function/i,
  /failed to fetch/i,
  /networkerror/i,
  /sql/i,
  /database/i,
  /stack/i,
  /\bat\s+[\w$.]+\s*\(/i,
];

export function humanizeError(
  error: unknown,
  fallbackPt: string,
  language: AppLanguage = "pt",
  fallbackEn = "The operation could not be completed.",
) {
  const fallback = language === "en" ? fallbackEn : fallbackPt;
  if (!(error instanceof Error) || !error.message.trim()) return fallback;
  if (technicalPatterns.some((pattern) => pattern.test(error.message))) {
    return `${fallback} ${
      language === "en"
        ? "Your saved data remains safe. Try again or export a backup."
        : "Seus dados salvos continuam seguros. Tente novamente ou exporte um backup."
    }`;
  }
  return error.message.slice(0, 320);
}
