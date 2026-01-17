// Input validation helpers
export const MAX_TEXT_LENGTH = 5000;
export const MAX_NAME_LENGTH = 100;

export function isValidString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

export function isValidText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_TEXT_LENGTH;
}

export function isValidName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_NAME_LENGTH;
}

export function isValidPosition(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// Get CORS origin header based on request origin and allowed origins
export function getCorsOrigin(requestOrigin: string | null, allowedOrigins: string): string {
  // If allowing all origins, return '*'
  if (allowedOrigins === '*') {
    return '*';
  }

  if (!requestOrigin) {
    return '';
  }

  // Check if request origin is in allowed list
  const origins = allowedOrigins.split(',').map((o) => o.trim());
  if (origins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return '';
}
