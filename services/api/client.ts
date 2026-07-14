import { env } from "@/lib/env";
import type { DashboardApiResponse, LoginRequest, LoginResponse } from "@/services/api/types";
import type { JsonValue } from "@/types/domain";

const DEFAULT_TIMEOUT_MS = 15000;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody extends object | undefined = undefined> {
  body?: TBody;
  method?: HttpMethod;
  path: string;
  token?: string | null;
  timeoutMs?: number;
}

interface ApiErrorBody {
  code?: string | undefined;
  detail?: unknown;
  message?: string | undefined;
}

export interface ApiErrorDetails {
  code?: string | undefined;
  details?: unknown;
  isNetworkError: boolean;
  status: number | null;
}

export class ApiClientError extends Error {
  public readonly code: string | undefined;
  public readonly details: unknown;
  public readonly isNetworkError: boolean;
  public readonly status: number | null;

  public constructor(message: string, details: ApiErrorDetails) {
    super(message);
    this.name = "ApiClientError";
    this.code = details.code;
    this.details = details.details;
    this.isNetworkError = details.isNetworkError;
    this.status = details.status;
  }
}

function buildUrl(path: string) {
  const normalizedBaseUrl = env.apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readErrorBody(value: unknown): ApiErrorBody {
  if (!isRecord(value)) {
    return {};
  }

  const message = typeof value.message === "string" ? value.message : undefined;
  const detail = value.detail;
  const code = typeof value.code === "string" ? value.code : undefined;

  if (typeof detail === "string" && !message) {
    return { code, detail, message: detail };
  }

  return { code, detail, message };
}

function normalizeUnknownError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new ApiClientError("The request timed out.", {
      isNetworkError: true,
      status: null
    });
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message || "The request failed.", {
      details: error,
      isNetworkError: true,
      status: null
    });
  }

  return new ApiClientError("The request failed.", {
    details: error,
    isNetworkError: true,
    status: null
  });
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    throw new ApiClientError("The server returned an invalid JSON response.", {
      isNetworkError: false,
      status: response.status
    });
  }
}

export async function request<TResponse, TBody extends object | undefined = undefined>({
  body,
  method = "GET",
  path,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  token
}: RequestOptions<TBody>): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestInit: RequestInit = {
      headers,
      method,
      signal: controller.signal
    };

    if (body) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(path), requestInit);

    const parsedBody = await parseJsonResponse(response);

    if (!response.ok) {
      const errorBody = readErrorBody(parsedBody);

      throw new ApiClientError(errorBody.message ?? "The server rejected the request.", {
        code: errorBody.code,
        details: errorBody.detail,
        isNetworkError: false,
        status: response.status
      });
    }

    return parsedBody as TResponse;
  } catch (error: unknown) {
    throw normalizeUnknownError(error);
  } finally {
    clearTimeout(timeout);
  }
}

export function login(body: LoginRequest) {
  return request<LoginResponse, LoginRequest>({
    body,
    method: "POST",
    path: "/api/login"
  });
}

export function getDashboard(token: string) {
  return request<DashboardApiResponse>({
    path: "/api/dashboard",
    token
  });
}

export const apiClient = {
  getDashboard,
  login,
  request
};
