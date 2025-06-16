import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const storage = {
  setItem: async (key, value) => {
    try {
      if (isWeb) {
        window.localStorage.setItem(key, value);
        return true;
      }
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("Storage setItem error:", error);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      if (isWeb) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error("Storage getItem error:", error);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      if (isWeb) {
        window.localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error("Storage removeItem error:", error);
      return false;
    }
  },

  clear: async () => {
    try {
      if (isWeb) {
        window.localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  },
};
