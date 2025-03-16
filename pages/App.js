"use client";

import { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdminDashboard from "./AdminDashboard";
import TrainerHome from "./TrainerHome";
import StaffDashboard from "./StaffDashboard";
import styles from "./LoginScreenStyles";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

  const API_URL = Platform.select({
    native: "http://10.0.2.2/lifthub/connect.php",
    default: "http://localhost/lifthub/connect.php",
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginStatus("Please enter both email and password");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Login response:", result);

      if (result.success) {
        setLoginStatus("Login successful!");
        setUserType(result.userType);
        setIsLoggedIn(true);
      } else {
        setLoginStatus(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginStatus("Login failed: " + error.message);
    }
  };

  if (isLoggedIn) {
    if (userType === "admin") {
      return <AdminDashboard setIsLoggedIn={setIsLoggedIn} />;
    } else if (userType === "trainer") {
      return <TrainerHome setIsLoggedIn={setIsLoggedIn} />;
    } else if (userType === "staff") {
      return <StaffDashboard setIsLoggedIn={setIsLoggedIn} />;
    }
  }

  return (
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
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.loginStatus}>{loginStatus}</Text>
          <View style={styles.footer}>
            <TouchableOpacity>
              <Text style={styles.footerText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
