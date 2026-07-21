const sensitiveError = /(api[_ -]?key|authorization|bearer|token|secret|password|xi-api-key|[A-Za-z]:[\\/])/i;

/** Keep useful validation errors in the local UI without reflecting provider credentials, paths, or tool output. */
export const publicErrorMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || sensitiveError.test(message)) return fallback;
  return message.slice(0, 500);
};
