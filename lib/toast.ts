import { Alert, Platform, ToastAndroid } from "react-native";

export function showToast(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }

  Alert.alert("", message);
}
