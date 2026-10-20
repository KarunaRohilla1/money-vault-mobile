import { Alert } from "react-native";

export type ImagePickResult =
  | { status: "success"; uri: string }
  | { status: "cancelled" }
  | { status: "permission_denied" }
  | { status: "unavailable"; message?: string }
  | { status: "error"; message?: string };

export async function pickWishlistGalleryImage(): Promise<ImagePickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please grant photo library access to choose a product image from your gallery."
      );
      return { status: "permission_denied" };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { status: "cancelled" };
    }

    const asset = result.assets[0];
    if (asset?.uri) {
      return { status: "success", uri: asset.uri };
    }

    return { status: "cancelled" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ExponentImagePicker") || message.includes("Cannot find native module")) {
      Alert.alert(
        "Image Picker Unavailable",
        "The photo gallery native module is not available in the current native build. Please rebuild your development client or app binary."
      );
      return { message, status: "unavailable" };
    }

    Alert.alert("Error", "Could not open image library.");
    return { message, status: "error" };
  }
}
