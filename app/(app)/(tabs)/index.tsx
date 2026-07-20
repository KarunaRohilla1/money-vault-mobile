import { DashboardScreen } from "@/features/dashboard/DashboardScreen";
import { SharedScreen } from "@/features/shared/SharedScreen";
import { isSharedVault } from "@/lib/vaultNavigation";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardRoute() {
  const vault = useAuthStore((state) => state.vault);
  if (isSharedVault(vault)) {
    return <SharedScreen />;
  }
  return <DashboardScreen />;
}
