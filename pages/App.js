"use client";

import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AdminDashboard from "./AdminDashboard";
import TrainerHome from "./TrainerHome";
import StaffDashboard from "./StaffDashboard";
import styles from "./LoginScreenStyles";
import MemberHome from "./MemberHome";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import { storage } from "../utils/storage";

// Storage utility to handle both web and mobile platforms
const Storage = {
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

const LoginScreen = () => {
  const { isLoggedIn, setIsLoggedIn, userType, setUserType } =
    useContext(AuthContext);

  useEffect(() => {
    if (typeof setIsLoggedIn !== "function") {
      console.error("setIsLoggedIn is not available from AuthContext");
    }
  }, [setIsLoggedIn]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [userTypeState, setUserTypeState] = useState(null);

  // Check if running on Android
  const isAndroid = Platform.OS === "android";
  // Check if running on web (you might need to adjust this based on your environment)
  const isWeb = Platform.OS === "web";

  // Check login status on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isAuth = await Storage.getItem("isAuthenticated");
        const storedUserType = await Storage.getItem("userType");
        if (isAuth === "true" && storedUserType) {
          // Verify the user type is compatible with the platform
          if (
            (isAndroid &&
              (storedUserType === "member" || storedUserType === "trainer")) ||
            (isWeb &&
              (storedUserType === "admin" || storedUserType === "staff"))
          ) {
            setIsLoggedInState(true);
            setUserTypeState(storedUserType);
          } else {
            // Incompatible user type for this platform - force logout
            await Storage.clear();
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  // Continuous authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await Storage.getItem("isAuthenticated");
      if (isAuth !== "true") {
        setIsLoggedInState(false);
        setUserTypeState(null);
      }
    };

    const interval = setInterval(checkAuth, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  const API_URL = Platform.select({
    native: "http://10.0.2.2/lifthub/connect.php",
    default: "http://localhost/lifthub/connect.php",
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginStatus("Please enter both email and password");
      return;
    }

    setLoginStatus("Logging in...");
    try {
      console.log("Attempting login for:", email);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      if (!response.ok) {
        console.error("Login HTTP error:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Login response:", result);

      if (result.success) {
        // Check platform compatibility
        const incompatibleWebUser =
          isWeb &&
          (result.userType === "member" || result.userType === "trainer");
        const incompatibleAndroidUser =
          isAndroid &&
          (result.userType === "admin" || result.userType === "staff");

        if (incompatibleAndroidUser) {
          setLoginStatus("Admin/Staff accounts can only be used on web");
          return;
        }

        if (incompatibleWebUser) {
          setLoginStatus("Please use the mobile app for member/trainer access");
          return;
        }

        // If compatible, proceed with login
        await proceedWithLogin(result);
      } else {
        console.error("Login failed:", result.message);
        setLoginStatus(result.message || "Invalid credentials");
        setPassword(""); // Clear password field on failed login
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginStatus("Connection error. Please try again.");
      setPassword(""); // Clear password field on error
    }
  };

  const proceedWithLogin = async (result) => {
    try {
      await Storage.setItem("isAuthenticated", "true");
      await Storage.setItem("userType", result.userType);
      if (result.userId) {
        await Storage.setItem("userId", result.userId.toString());
      }

      setLoginStatus("Login successful!");
      setUserTypeState(result.userType);
      setIsLoggedInState(true);

      // Clear text fields after successful login
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Storage error:", error);
      setLoginStatus("Login successful but failed to save session");
    }
  };

  // Enhanced set login state function that updates both state and storage
  const handleSetIsLoggedIn = (value) => {
    console.log("Setting login state to:", value);
    setIsLoggedIn(value);

    if (!value) {
      // Clear storage on logout
      AsyncStorage.removeItem("userToken");
      AsyncStorage.removeItem("userType");
      AsyncStorage.removeItem("userId");

      if (storage && typeof storage.clear === "function") {
        storage.clear();
      }

      console.log("Storage cleared on logout");
    }
  };

  // Monitor login state changes for debugging
  useEffect(() => {
    console.log(
      "Auth state changed - isLoggedIn:",
      isLoggedIn,
      "userType:",
      userType
    );
  }, [isLoggedIn, userType]);

  if (isLoggedInState) {
    return (
      <AuthProvider>
        {userTypeState === "admin" && (
          <AdminDashboard setIsLoggedIn={setIsLoggedIn} />
        )}
        {userTypeState === "trainer" && (
          <TrainerHome setIsLoggedIn={setIsLoggedIn} />
        )}
        {userTypeState === "staff" && (
          <StaffDashboard setIsLoggedIn={setIsLoggedIn} />
        )}
        {userTypeState === "member" && (
          <MemberHome setIsLoggedIn={setIsLoggedIn} />
        )}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Ionicons name="barbell-outline" size={80} color="#6397C9" />
              <Text style={styles.logoText}>LiftHub</Text>
            </View>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#808080"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#808080"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.loginStatus}>{loginStatus}</Text>
            <View style={styles.footer}></View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthProvider>
  );
};

export default LoginScreen;
