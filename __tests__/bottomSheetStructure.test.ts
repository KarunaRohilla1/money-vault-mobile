import { BottomSheet } from "@/components/ui/BottomSheet";

jest.mock("react-native", () => ({
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Modal: "Modal",
  Platform: { OS: "android" },
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  Text: "Text",
  View: "View"
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: () => ({ bottom: 24, top: 24 })
}));

describe("BottomSheet layout structure", () => {
  const source = BottomSheet.toString();

  it("uses safe-area, keyboard avoiding, and scroll containers", () => {
    expect(source).toContain("KeyboardAvoidingView");
    expect(source).toContain("ScrollView");
    expect(source).toContain("top");
    expect(source).toContain("keyboardShouldPersistTaps");
  });

  it("does not use a negative top offset for the full-screen form", () => {
    expect(source).not.toContain("marginTop: -");
    expect(source).not.toContain("top: -");
  });
});
