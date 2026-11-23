export function normalizeErrorReason(
  reason: unknown,
  fallbackMessage: string,
): Error {
  if (reason instanceof Error) return reason;
  return new Error(fallbackMessage, { cause: reason });
}
