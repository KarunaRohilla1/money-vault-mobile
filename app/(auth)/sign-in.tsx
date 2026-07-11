import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui";

export default function SignInRoute() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Authentication"
        title="Sign in"
        description="Supabase authentication will be connected to this route."
      />
      <EmptyState
        icon="login"
        title="Sign-in placeholder"
        message="This route establishes the auth surface without implementing a business flow."
      />
    </Screen>
  );
}
