export type SafeToSpendStatusTone = "positive" | "neutral" | "warning" | "danger";

export interface SafeToSpendStatusInput {
  safeToSpend: number;
}

export interface SafeToSpendStatus {
  message: string;
  tone: SafeToSpendStatusTone;
}

export function getSafeToSpendStatus({ safeToSpend }: SafeToSpendStatusInput): SafeToSpendStatus {
  if (safeToSpend < 5000) {
    return {
      message: "⚠️ Tight cycle. Be mindful of discretionary spending.",
      tone: "warning"
    };
  }

  if (safeToSpend < 15000) {
    return {
      message: "✅ You're comfortably within budget.",
      tone: "positive"
    };
  }

  return {
    message: "🎉 Plenty of room left this cycle.",
    tone: "positive"
  };
}
