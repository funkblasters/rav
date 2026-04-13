/**
 * Input validation utilities to prevent DoS and data integrity issues
 */

export const INPUT_LIMITS = {
  name: { min: 1, max: 255 },
  description: { min: 0, max: 2000 },
  email: { min: 5, max: 254 },
  displayName: { min: 1, max: 100 },
  password: { min: 8, max: 128 },
  city: { min: 1, max: 100 },
  title: { min: 1, max: 255 },
  location: { min: 1, max: 255 },
  link: { min: 5, max: 2048 },
  imageUrl: { min: 5, max: 2048 },
};

export function validateString(
  value: string | undefined | null,
  limit: { min: number; max: number },
  fieldName: string,
  required = false
): string | null {
  if (!value) {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length < limit.min || trimmed.length > limit.max) {
    throw new Error(
      `${fieldName} must be between ${limit.min} and ${limit.max} characters`
    );
  }

  return trimmed;
}

export function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();

  // RFC 5322 simplified regex
  const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!EMAIL_RE.test(trimmed)) {
    throw new Error("Invalid email format");
  }

  return trimmed;
}

export function validatePassword(password: string): void {
  validateString(password, INPUT_LIMITS.password, "Password", true);

  // Additional password requirements
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one number");
  }
}

export function validateOptionalFloat(
  value: number | undefined,
  fieldName: string,
  min: number,
  max: number
): number | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }

  return value;
}

export function validatePositiveNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return value;
}

export function validateOptionalLimit(
  value: number | undefined,
  max: number = 100,
  min: number = 1
): number {
  if (value === undefined) return max;

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Limit must be an integer");
  }

  if (value < min || value > max) {
    throw new Error(`Limit must be between ${min} and ${max}`);
  }

  return value;
}
