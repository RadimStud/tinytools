export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export function getToolErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof ToolError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
