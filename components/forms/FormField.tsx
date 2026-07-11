import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  error?: string;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Text className="font-sans text-sm font-semibold text-text">{label}</Text>
      {children}
      {error ? <Text className="font-sans text-xs text-state-danger">{error}</Text> : null}
    </View>
  );
}
