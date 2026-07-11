import type { ApiErrorShape } from "@/types/domain";

export class AppError extends Error {
  public readonly code: string | undefined;
  public readonly cause?: unknown;

  public constructor(error: ApiErrorShape) {
    super(error.message);
    this.name = "AppError";
    this.code = error.code;
    this.cause = error.cause;
  }
}

export function toAppError(error: unknown, fallbackMessage = "Something went wrong."): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({ message: error.message, cause: error });
  }

  return new AppError({ message: fallbackMessage, cause: error });
}
