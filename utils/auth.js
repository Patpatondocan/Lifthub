import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { storage } from "./storage";

/**
 * Comprehensive logout function that works across platforms
 * and handles the auth state update and navigation
 *
 * @param {Function} setIsLoggedInCallback - Function to update auth state
 * @returns {Promise<boolean>} - Success status
 */
export const logout = async (setIsLoggedInCallback) => {
  try {
    console.log("Logout function called");

    // Clear AsyncStorage for mobile platforms
    if (Platform.OS !== "web") {
      console.log("Mobile logout: clearing AsyncStorage");
      await AsyncStorage.clear();
      await AsyncStorage.removeItem("isAuthenticated");
      await AsyncStorage.removeItem("userType");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("userToken");
    }
    // Clear localStorage for web platform
    else {
      console.log("Web logout: clearing localStorage");
      localStorage.clear();
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userType");
      localStorage.removeItem("userId");
      localStorage.removeItem("userToken");
    }

    // Use storage utility for additional clearing
    if (storage && typeof storage.clear === "function") {
      await storage.clear();
    }

    // Update auth state via callback
    if (typeof setIsLoggedInCallback === "function") {
      console.log("Setting isLoggedIn state to false");
      setIsLoggedInCallback(false);

      // Force navigation back to login screen
      if (Platform.OS === "web") {
        console.log("Web platform detected, redirecting to login page");
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      }
    } else {
      console.warn("No valid setIsLoggedIn callback provided");
    }

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};
