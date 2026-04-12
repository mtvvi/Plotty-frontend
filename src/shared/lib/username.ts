/** Правила совпадают с CHECK в plotty_backend/migrations/002_users.up.sql */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 40;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export function isValidUsername(value: string): boolean {
  const trimmed = value.trim();

  return (
    trimmed.length >= USERNAME_MIN_LENGTH &&
    trimmed.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(trimmed)
  );
}

export function usernameValidationMessage(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Введите ник.";
  }

  if (trimmed.length < USERNAME_MIN_LENGTH || trimmed.length > USERNAME_MAX_LENGTH) {
    return `Ник — от ${USERNAME_MIN_LENGTH} до ${USERNAME_MAX_LENGTH} символов.`;
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    return "Только латиница, цифры и знак подчёркивания.";
  }

  return null;
}
