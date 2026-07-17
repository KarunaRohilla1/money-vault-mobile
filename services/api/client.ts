import * as accounts from "@/services/api/accounts";
import * as auth from "@/services/api/auth";
import { request } from "@/services/api/core";
import * as categories from "@/services/api/categories";
import * as dashboard from "@/services/api/dashboard";
import * as planning from "@/services/api/planning";
import * as reports from "@/services/api/reports";
import * as settings from "@/services/api/settings";
import * as shared from "@/services/api/shared";
import * as transactions from "@/services/api/transactions";
import * as transfers from "@/services/api/transfers";
import * as wishlist from "@/services/api/wishlist";

export { ApiClientError, request, type ApiErrorDetails } from "@/services/api/core";

export * from "@/services/api/accounts";
export * from "@/services/api/auth";
export * from "@/services/api/categories";
export * from "@/services/api/dashboard";
export * from "@/services/api/planning";
export * from "@/services/api/reports";
export * from "@/services/api/settings";
export * from "@/services/api/shared";
export * from "@/services/api/transactions";
export * from "@/services/api/transfers";
export * from "@/services/api/wishlist";

export const apiClient = {
  ...accounts,
  ...auth,
  ...categories,
  ...dashboard,
  ...planning,
  ...reports,
  ...settings,
  ...shared,
  ...transactions,
  ...transfers,
  ...wishlist,
  request
};
