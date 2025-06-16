import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import MemberProfileScreen from "./screens/MemberProfileScreen";
import MemberWorkoutsScreen from "./screens/MemberWorkoutsScreen";
import MyWorkoutsScreen from "./screens/MyWorkoutsScreen";
import MemberSettingsScreen from "./screens/MemberSettingsScreen";

const MemberHome = () => {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");

  // Verify setIsLoggedIn is available
  useEffect(() => {
    if (typeof setIsLoggedIn !== "function") {
      console.error("setIsLoggedIn is not available in MemberHome");
    }
  }, [setIsLoggedIn]);

  const renderScreen = () => {
    switch (activeTab) {
      case "profile":
        return <MemberProfileScreen />;
      case "workouts":
        return <MemberWorkoutsScreen />;
      case "myworkouts":
        return <MyWorkoutsScreen />;
      case "settings":
        return <MemberSettingsScreen />;
      default:
        return <MemberProfileScreen />;
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
        <TabButton
          name="My Workouts"
          icon="bookmark-outline"
          tab="myworkouts"
        />
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

export default MemberHome;
