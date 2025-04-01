"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WorkoutsScreen from "./screens/WorkoutsScreen";
import TraineesScreen from "./screens/TraineesScreen";
import ProfileScreen from "./screens/ProfileScreen";

const TrainerHome = () => {
  const [activeTab, setActiveTab] = useState("workouts");
  const [isLogOut, setIsLogOut] = useState(false);

  useEffect(() => {
    // Check login status when component mounts
    const checkLoginStatus = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      if (!isAuthenticated) {
        setIsLogOut(true);
      }
    };

    checkLoginStatus();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case "workouts":
        return <WorkoutsScreen />;
      case "trainees":
        return <TraineesScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <WorkoutsScreen />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userType");
    setIsLogOut(true);
    window.location.href = "/";
  };

  if (isLogOut) {
    window.location.href = "/";
    return null;
  }

  const TabButton = ({ name, icon, tab }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon}
        size={24}
        color={activeTab === tab ? "#FFFFFF" : "#6397C9"}
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <View style={styles.tabBar}>
        <TabButton name="Workouts" icon="barbell-outline" tab="workouts" />
        <TabButton name="Trainees" icon="people-outline" tab="trainees" />
        <TabButton name="Profile" icon="person-outline" tab="profile" />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#6397C9" />
          <Text style={styles.tabText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1A1A1A",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  activeTabButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    paddingVertical: 5,
  },
  tabText: {
    color: "#6397C9",
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  logoutButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});

export default TrainerHome;
