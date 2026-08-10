import * as Clipboard from "expo-clipboard";
import { useCallback, useState } from "react";

export function useClipboard() {
  const [text, setText] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readClipboard = useCallback(async () => {
    setIsReading(true);
    setError(null);

    try {
      const value = await Clipboard.getStringAsync();
      const next = value ?? "";
      setText(next);
      return next;
    } catch {
      setError("Unable to read clipboard.");
      return "";
    } finally {
      setIsReading(false);
    }
  }, []);

  return {
    error,
    isReading,
    readClipboard,
    setText,
    text
  };
}
