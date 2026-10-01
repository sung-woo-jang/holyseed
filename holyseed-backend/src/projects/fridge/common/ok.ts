export const ok = (message: string, data: unknown = null) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});
