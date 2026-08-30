/**
 * Deeply strips undefined, functions, and invalid values from payloads
 * before passing to Firestore or backend APIs to prevent runtime crashes.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizePayload(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined && typeof value !== 'function') {
        cleanObj[key] = sanitizePayload(value);
      }
    }
    return cleanObj as T;
  }

  return obj;
}
