export interface ClipboardReadResult {
  errorCode: "CLIPBOARD_EMPTY" | "CLIPBOARD_UNAVAILABLE" | null;
  text: string;
}

interface ExpoClipboardModule {
  getStringAsync?: () => Promise<string>;
}

export async function readClipboardText(): Promise<ClipboardReadResult> {
  try {
    const clipboardModule = (await import("expo-clipboard")) as ExpoClipboardModule;
    const text = (await clipboardModule.getStringAsync?.()) ?? "";
    if (!text.trim()) {
      return { errorCode: "CLIPBOARD_EMPTY", text: "" };
    }
    return { errorCode: null, text };
  } catch {
    return { errorCode: "CLIPBOARD_UNAVAILABLE", text: "" };
  }
}
