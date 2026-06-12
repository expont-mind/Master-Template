// Internal helper. Apps should not import this directly.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Did you copy .env.example to .env.local and fill it in?`,
    );
  }
  return value;
}
