import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { SecondaryButton } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Section } from "@/components/layout/Section";

export function MorePlaceholder() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="More" description="Tools and configuration for your current vault." />
      <Section title="Money tools">
        <View className="gap-3">
          <MoreAction title="Transactions" subtitle="Search and review vault activity." onPress={() => router.push("/transactions" as never)} />
          <MoreAction title="Transfers" subtitle="Review account-to-account movements." onPress={() => router.push("/transfers" as never)} />
          <MoreAction title="Categories" subtitle="Review system and custom categories." onPress={() => router.push("/categories" as never)} />
          <MoreAction title="Wishlist" subtitle="Track savings toward planned purchases." onPress={() => router.push("/wishlist" as never)} />
        </View>
      </Section>
      <Section title="Settings">
        <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
          <Text className="font-sans text-base font-semibold text-text">Vault settings</Text>
          <Text className="font-sans text-sm text-text-muted">PIN changes, vault switching, and shared-vault administration require the next settings API slice.</Text>
        </View>
      </Section>
    </Screen>
  );
}

interface MoreActionProps {
  onPress: () => void;
  subtitle: string;
  title: string;
}

function MoreAction({ onPress, subtitle, title }: MoreActionProps) {
  return (
    <View className="gap-3 rounded-lg border border-surface-border bg-surface p-4">
      <View>
        <Text className="font-sans text-base font-semibold text-text">{title}</Text>
        <Text className="font-sans text-sm text-text-muted">{subtitle}</Text>
      </View>
      <SecondaryButton onPress={onPress}>Open</SecondaryButton>
    </View>
  );
}
