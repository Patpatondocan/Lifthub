"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrainerProfileScreen from "./screens/TrainerProfileScreen";
import WorkoutsScreen from "./screens/WorkoutsScreen";
import TraineesScreen from "./screens/TraineesScreen";
import TrainerSettingsScreen from "./screens/TrainerSettingsScreen";

const TrainerHome = ({ setIsLoggedIn }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (!id) {
          console.error("No userId found");
          return;
        }
        setUserId(id);
        // use userId for API calls
      } catch (error) {
        console.error("Error getting userId:", error);
      }
    };
    getUserId();
  }, []);
  const renderScreen = () => {
    switch (activeTab) {
      case "profile":
        return <TrainerProfileScreen />;
      case "workouts":
        return <WorkoutsScreen />;
      case "trainees":
        return <TraineesScreen />;
      case "settings":
        return <TrainerSettingsScreen setIsLoggedIn={setIsLoggedIn} />;
      default:
        return <TrainerProfileScreen />;
    }
  };

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
        <TabButton name="Profile" icon="person-outline" tab="profile" />
        <TabButton name="Workouts" icon="barbell-outline" tab="workouts" />
        <TabButton name="Trainees" icon="people-outline" tab="trainees" />
        <TabButton name="Settings" icon="settings-outline" tab="settings" />
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
});

export default TrainerHome;
