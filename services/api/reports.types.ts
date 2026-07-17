import type { JsonObject } from "@/types/domain";

export interface ReportsApiResponse {
  categoryBreakdown: JsonObject[];
  generatedAt: string;
  monthlyTrend: JsonObject[];
  period: JsonObject;
  summary: JsonObject;
}
