import React, { createContext, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext({
  isLoggedIn: false,
  userType: null,
  setIsLoggedIn: () => {},
  setUserType: () => {},
  storage: null,
});

// Storage utility to handle both web and mobile platforms
const storageUtil = {
  setItem: async (key, value) => {
    try {
      if (Platform.OS === "web") {
        window.localStorage.setItem(key, value);
        return true;
      } else {
        await AsyncStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },

  getItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        return window.localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  },

  removeItem: async (key) => {
    try {
      if (Platform.OS === "web") {
        window.localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userType,
        setIsLoggedIn,
        setUserType,
        storage: storageUtil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
