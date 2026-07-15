import { env } from "@/lib/env";
import type {
  AccountApi,
  AccountPayloadApi,
  CategoryApi,
  CategoryPayloadApi,
  DashboardApiResponse,
  LoginRequest,
  LoginResponse,
  PlanningApiResponse,
  PlanningItemPayloadApi,
  PlanningStatusPayloadApi,
  ReportsApiResponse,
  SettingsApiResponse,
  SuccessApiResponse,
  TransactionApi,
  TransactionDetailApi,
  TransactionFiltersApi,
  TransactionPayloadApi,
  TransferApi,
  TransferDetailApi,
  TransferPayloadApi,
  WishlistApiResponse,
  WishlistItemPayloadApi
} from "@/services/api/types";
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

function buildQuery(params: [string, string | number | undefined][]) {
  const query = new URLSearchParams();

  for (const [key, value] of params) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
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

function readStringField(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function readBooleanField(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }
  }

  return undefined;
}

function normalizeLoginResponse(value: unknown): LoginResponse {
  if (!isRecord(value)) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: { reason: "not_object" },
      isNetworkError: false,
      status: null
    });
  }

  const token = readStringField(value, ["token", "access_token"]);
  const vault = value.vault;

  if (!token || !isRecord(vault)) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: {
        hasToken: Boolean(token),
        hasVault: isRecord(vault)
      },
      isNetworkError: false,
      status: null
    });
  }

  const id = readStringField(vault, ["id"]);
  const name = readStringField(vault, ["name"]);
  const isAdmin = readBooleanField(vault, ["isAdmin", "is_admin"]);
  const vaultType = readStringField(vault, ["vaultType", "vault_type"]);

  if (!id || !name || isAdmin === undefined || !vaultType) {
    throw new ApiClientError("The login response was incomplete.", {
      code: "LOGIN_RESPONSE_INVALID",
      details: {
        hasId: Boolean(id),
        hasIsAdmin: isAdmin !== undefined,
        hasName: Boolean(name),
        hasVaultType: Boolean(vaultType)
      },
      isNetworkError: false,
      status: null
    });
  }

  const expiresAt = readStringField(value, ["expiresAt", "expires_at"]);

  return {
    ...(expiresAt ? { expiresAt } : {}),
    token,
    vault: {
      id,
      isAdmin,
      name,
      vaultType
    }
  };
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
  return request<unknown, LoginRequest>({
    body,
    method: "POST",
    path: "/api/login"
  }).then(normalizeLoginResponse);
}

export function getDashboard(token: string) {
  return request<DashboardApiResponse>({
    path: "/api/dashboard",
    token
  });
}

export function getAccounts(token: string) {
  return request<AccountApi[]>({
    path: "/api/accounts",
    token
  });
}

export function createAccount(token: string, body: AccountPayloadApi) {
  return request<SuccessApiResponse, AccountPayloadApi>({
    body,
    method: "POST",
    path: "/api/accounts",
    token
  });
}

export function updateAccount(token: string, accountId: number, body: AccountPayloadApi) {
  return request<AccountApi, AccountPayloadApi>({
    body,
    method: "PUT",
    path: `/api/accounts/${accountId}`,
    token
  });
}

export function deleteAccount(token: string, accountId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/accounts/${accountId}`,
    token
  });
}

export function setPrimaryAccount(token: string, accountId: number) {
  return request<SuccessApiResponse>({
    method: "POST",
    path: `/api/accounts/${accountId}/primary`,
    token
  });
}

export function getCategories(token: string) {
  return request<CategoryApi[]>({
    path: "/api/categories",
    token
  });
}

export function createCategory(token: string, body: CategoryPayloadApi) {
  return request<SuccessApiResponse, CategoryPayloadApi>({
    body,
    method: "POST",
    path: "/api/categories",
    token
  });
}

export function updateCategory(token: string, categoryId: number, body: CategoryPayloadApi) {
  return request<SuccessApiResponse, CategoryPayloadApi>({
    body,
    method: "PUT",
    path: `/api/categories/${categoryId}`,
    token
  });
}

export function deleteCategory(token: string, categoryId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/categories/${categoryId}`,
    token
  });
}

export function getTransactions(token: string, filters: TransactionFiltersApi = {}) {
  return request<TransactionApi[]>({
    path: `/api/transactions${buildQuery([
      ["account", filters.account],
      ["category", filters.category],
      ["dateFrom", filters.dateFrom],
      ["dateTo", filters.dateTo],
      ["month", filters.month],
      ["search", filters.search],
      ["sortBy", filters.sortBy]
    ])}`,
    token
  });
}

export function createTransaction(token: string, body: TransactionPayloadApi) {
  return request<TransactionDetailApi, TransactionPayloadApi>({
    body,
    method: "POST",
    path: "/api/transactions",
    token
  });
}

export function updateTransaction(token: string, transactionId: number, body: TransactionPayloadApi) {
  return request<TransactionDetailApi, TransactionPayloadApi>({
    body,
    method: "PUT",
    path: `/api/transactions/${transactionId}`,
    token
  });
}

export function deleteTransaction(token: string, transactionId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/transactions/${transactionId}`,
    token
  });
}

export function getTransfers(token: string) {
  return request<TransferApi[]>({
    path: "/api/transfers",
    token
  });
}

export function createTransfer(token: string, body: TransferPayloadApi) {
  return request<TransferDetailApi, TransferPayloadApi>({
    body,
    method: "POST",
    path: "/api/transfers",
    token
  });
}

export function updateTransfer(token: string, transferGroupId: string, body: TransferPayloadApi) {
  return request<TransferDetailApi, TransferPayloadApi>({
    body,
    method: "PUT",
    path: `/api/transfers/${transferGroupId}`,
    token
  });
}

export function deleteTransfer(token: string, transferGroupId: string) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/transfers/${transferGroupId}`,
    token
  });
}

export function getPlanning(token: string) {
  return request<PlanningApiResponse>({
    path: "/api/planning",
    token
  });
}

export function createCommitment(token: string, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/planning/commitments",
    token
  });
}

export function updateCommitment(token: string, commitmentId: number, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/planning/commitments/${commitmentId}`,
    token
  });
}

export function deleteCommitment(token: string, commitmentId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/planning/commitments/${commitmentId}`,
    token
  });
}

export function setCommitmentStatus(token: string, commitmentId: number, body: PlanningStatusPayloadApi) {
  return request<SuccessApiResponse, PlanningStatusPayloadApi>({
    body,
    method: "POST",
    path: `/api/planning/commitments/${commitmentId}/status`,
    token
  });
}

export function createIncomeTemplate(token: string, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/planning/income-templates",
    token
  });
}

export function updateIncomeTemplate(token: string, templateId: number, body: PlanningItemPayloadApi) {
  return request<SuccessApiResponse, PlanningItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/planning/income-templates/${templateId}`,
    token
  });
}

export function deleteIncomeTemplate(token: string, templateId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/planning/income-templates/${templateId}`,
    token
  });
}

export function setIncomeStatus(token: string, templateId: number, body: PlanningStatusPayloadApi) {
  return request<SuccessApiResponse, PlanningStatusPayloadApi>({
    body,
    method: "POST",
    path: `/api/planning/income-templates/${templateId}/status`,
    token
  });
}

export function closeActivePlanningCycle(token: string) {
  return request<PlanningApiResponse["cycle"]>({
    method: "POST",
    path: "/api/planning/cycles/close-active",
    token
  });
}

export function getWishlist(token: string) {
  return request<WishlistApiResponse>({
    path: "/api/wishlist",
    token
  });
}

export function getReports(token: string) {
  return request<ReportsApiResponse>({
    path: "/api/reports",
    token
  });
}

export function getSettings(token: string) {
  return request<SettingsApiResponse>({
    path: "/api/settings",
    token
  });
}

export function createWishlistItem(token: string, body: WishlistItemPayloadApi) {
  return request<SuccessApiResponse, WishlistItemPayloadApi>({
    body,
    method: "POST",
    path: "/api/wishlist/items",
    token
  });
}

export function updateWishlistItem(token: string, itemId: number, body: WishlistItemPayloadApi) {
  return request<SuccessApiResponse, WishlistItemPayloadApi>({
    body,
    method: "PUT",
    path: `/api/wishlist/items/${itemId}`,
    token
  });
}

export function deleteWishlistItem(token: string, itemId: number) {
  return request<SuccessApiResponse>({
    method: "DELETE",
    path: `/api/wishlist/items/${itemId}`,
    token
  });
}

export const apiClient = {
  closeActivePlanningCycle,
  createAccount,
  createCategory,
  createCommitment,
  createIncomeTemplate,
  createTransaction,
  createTransfer,
  createWishlistItem,
  deleteAccount,
  deleteCategory,
  deleteCommitment,
  deleteIncomeTemplate,
  deleteTransaction,
  deleteTransfer,
  deleteWishlistItem,
  getAccounts,
  getCategories,
  getDashboard,
  getPlanning,
  getReports,
  getSettings,
  getTransactions,
  getTransfers,
  getWishlist,
  login,
  request,
  setPrimaryAccount,
  setCommitmentStatus,
  setIncomeStatus,
  updateAccount,
  updateCategory,
  updateCommitment,
  updateIncomeTemplate,
  updateTransaction,
  updateTransfer,
  updateWishlistItem
};
