import AsyncStorage from "@react-native-async-storage/async-storage";

export const zustandStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value)
};
