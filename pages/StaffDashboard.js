"use client";

import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MembersSection from "./MembersSection";

const StaffDashboard = ({ setIsLoggedIn }) => {
  // Add setIsLoggedIn prop
  const [activeSection, setActiveSection] = useState("logbook");
  const [modalVisible, setModalVisible] = useState(false);
  const [newLogName, setNewLogName] = useState("");

  const handleAddLog = () => {
    console.log("Adding log:", newLogName);
    setModalVisible(false);
    setNewLogName("");
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // This will redirect back to login screen
    console.log("Logging out...");
  };

  const renderMainContent = () => {
    if (activeSection === "members") {
      return <MembersSection />;
    }

    return (
      <>
        <View style={styles.logBookHeader}>
          <Text style={styles.logBookTitle}>LOG BOOK</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>ADD LOG</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logBook}>
          <View style={styles.logEntry}>
            <Text style={styles.logText}>Log entries will appear here</Text>
          </View>
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>LiftHub</Text>
          </View>
          <ScrollView style={styles.sidebarContent}>
            <TouchableOpacity
              style={[
                styles.sidebarButton,
                activeSection === "members" && styles.sidebarButtonActive,
              ]}
              onPress={() => setActiveSection("members")}
            >
              <Ionicons
                name="people-outline"
                size={24}
                color={activeSection === "members" ? "#FFFFFF" : "#6397C9"}
              />
              <Text
                style={[
                  styles.sidebarButtonText,
                  activeSection === "members" && styles.sidebarButtonTextActive,
                ]}
              >
                Members
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sidebarButton,
                activeSection === "logbook" && styles.sidebarButtonActive,
              ]}
              onPress={() => setActiveSection("logbook")}
            >
              <Ionicons
                name="book-outline"
                size={24}
                color={activeSection === "logbook" ? "#FFFFFF" : "#6397C9"}
              />
              <Text
                style={[
                  styles.sidebarButtonText,
                  activeSection === "logbook" && styles.sidebarButtonTextActive,
                ]}
              >
                Log Book
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#6397C9" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mainContent}>{renderMainContent()}</View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newLogName}
              onChangeText={setNewLogName}
              placeholder="Enter name here"
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddLog}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 280,
    backgroundColor: "#111111",
    borderRightWidth: 1,
    borderRightColor: "#222",
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  sidebarTitle: {
    color: "#6397C9",
    fontSize: 24,
    fontWeight: "bold",
  },
  sidebarContent: {
    flex: 1,
    padding: 15,
  },
  sidebarButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#1A1A1A",
  },
  sidebarButtonActive: {
    backgroundColor: "#6397C9",
  },
  sidebarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 12,
  },
  sidebarButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  logoutButtonText: {
    color: "#6397C9",
    fontSize: 16,
    marginLeft: 12,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  logBookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logBookTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.3)",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  logBook: {
    flex: 1,
  },
  logEntry: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  logText: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    color: "#6397C9",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: "#111111",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default StaffDashboard;
