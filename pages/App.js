import React, { useState, useEffect, useContext } from "react";
import { Platform, Modal } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import {
  SafeAreaView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AdminDashboard from "./AdminDashboard";
import TrainerHome from "./TrainerHome";
import StaffDashboard from "./StaffDashboard";
import styles from "./LoginScreenStyles";
import MemberHome from "./MemberHome";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import { storage } from "../utils/storage";
import { CustomAlertProvider, useCustomAlert } from "../components/CustomAlert";

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
  // All hooks at the top, before any return or conditional
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...MaterialCommunityIcons.font,
  });
  const { isLoggedIn, setIsLoggedIn, userType, setUserType } =
    useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [isLoggedInState, setIsLoggedInState] = useState(false);
  const [userTypeState, setUserTypeState] = useState(null);
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  // Reusable alert modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Reusable showAlert function
  const showCustomAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // Check if running on Android
  const isAndroid = Platform.OS === "android";
  // Check if running on web
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (typeof setIsLoggedIn !== "function") {
      console.error("setIsLoggedIn is not available from AuthContext");
    }
  }, [setIsLoggedIn]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isAuth = await Storage.getItem("isAuthenticated");
        const storedUserType = await Storage.getItem("userType");
        if (isAuth === "true" && storedUserType) {
          if (
            (isAndroid &&
              (storedUserType === "member" || storedUserType === "trainer")) ||
            (isWeb &&
              (storedUserType === "admin" || storedUserType === "staff"))
          ) {
            setIsLoggedInState(true);
            setUserTypeState(storedUserType);
          } else {
            await Storage.clear();
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await Storage.getItem("isAuthenticated");
      if (isAuth !== "true") {
        setIsLoggedInState(false);
        setUserTypeState(null);
      }
    };
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log(
      "Auth state changed - isLoggedIn:",
      isLoggedIn,
      "userType:",
      userType
    );
  }, [isLoggedIn, userType]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <Text style={{ color: "#fff" }}>Loading fonts...</Text>
      </View>
    );
  }

  const API_URL = Platform.select({
    native: "http://10.0.2.2/lifthub/connect.php",
    default: "http://localhost/lifthub/connect.php",
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginStatus("Please enter both email and password");
      setLoginErrorMessage("Please enter both email and password");
      setShowLoginErrorModal(true);
      showAlertSafe("Login Failed", "Please enter both email and password");
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
        setLoginErrorMessage(result.message || "Invalid credentials");
        setShowLoginErrorModal(true);
        showAlertSafe("Login Failed", result.message || "Invalid credentials");
        setPassword(""); // Clear password field on failed login
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginStatus("Connection Invalid Credentials. Please try again.");
      setLoginErrorMessage("Connection Invalid Credentials. Please try again.");
      setShowLoginErrorModal(true);
      showAlertSafe(
        "Login Error",
        "Connection Invalid Credentials. Please try again."
      );
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
    <CustomAlertProvider>
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
              {/* Login Error Modal */}
              <Modal
                visible={showLoginErrorModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLoginErrorModal(false)}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#1A1A1A",
                      padding: 30,
                      borderRadius: 16,
                      alignItems: "center",
                      maxWidth: 320,
                    }}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={48}
                      color="#FF4444"
                      style={{ marginBottom: 10 }}
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "bold",
                        marginBottom: 10,
                      }}
                    >
                      Login Failed
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        textAlign: "center",
                        marginBottom: 20,
                      }}
                    >
                      {loginErrorMessage}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#6397C9",
                        paddingVertical: 10,
                        paddingHorizontal: 30,
                        borderRadius: 8,
                      }}
                      onPress={() => setShowLoginErrorModal(false)}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        OK
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <View style={styles.footer}></View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AuthProvider>
    </CustomAlertProvider>
  );
};

export default LoginScreen;
