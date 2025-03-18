"use client";

import { useState, useEffect, useRef } from "react";
import { Camera } from "expo-camera";
import { Html5Qrcode } from "html5-qrcode";
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
  const [activeSection, setActiveSection] = useState("logbook");
  const [modalVisible, setModalVisible] = useState(false);
  const [newLogName, setNewLogName] = useState("");
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const html5QrCodeRef = useRef(null);

  const handleAddLog = () => {
    if (newLogName) {
      console.log("Adding log:", newLogName);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            setModalVisible(false);
            setScannedData(null);
            setNewLogName("");
            setIsCameraActive(true);
          })
          .catch(() => {
            // Proceed with modal close even if scanner stop fails
            setModalVisible(false);
            setScannedData(null);
            setNewLogName("");
            setIsCameraActive(true);
          });
      } else {
        setModalVisible(false);
        setScannedData(null);
        setNewLogName("");
        setIsCameraActive(true);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // This will redirect back to login screen
    console.log("Logging out...");
  };

  useEffect(() => {
    let scanner = null;

    const initializeScanner = async () => {
      if (Platform.OS === "web" && modalVisible) {
        try {
          // Wait for DOM to be ready
          await new Promise((resolve) => setTimeout(resolve, 500));

          const element = document.getElementById("qr-reader");
          if (!element) {
            console.error("QR reader element not found");
            return;
          }

          scanner = new Html5Qrcode("qr-reader");
          html5QrCodeRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              console.log("Scanned:", decodedText);
              setNewLogName(decodedText);
              setScannedData(decodedText);
            },
            (errorMessage) => {
              if (!errorMessage.includes("NotFoundException")) {
                console.error("QR Code Error:", errorMessage);
              }
            }
          );
        } catch (err) {
          console.error("Scanner initialization error:", err);
        }
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.getState() === 2 && // 2 means SCANNING
          html5QrCodeRef.current
            .stop()
            .then(() => {
              console.log("Scanner stopped");
              html5QrCodeRef.current = null;
            })
            .catch((err) => {
              // Ignore "not running" errors during cleanup
              if (!err.toString().includes("not running")) {
                console.error("Stop error:", err);
              }
            });
      }
    };
  }, [modalVisible]);

  const renderCamera = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.cameraContainer}>
          <div
            id="qr-reader"
            style={{
              width: "100%",
              height: "100%",
              background: "#111111",
            }}
          />
          {scannedData && (
            <View style={styles.scanSuccessOverlay}>
              <Ionicons name="checkmark-circle" size={60} color="#6397C9" />
              <Text style={styles.scanSuccessText}>Scanned: {scannedData}</Text>
            </View>
          )}
        </View>
      );
    }

    if (!hasPermission) {
      return <Text style={styles.cameraText}>No access to camera</Text>;
    }

    return (
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={isCameraActive ? handleBarCodeScanned : undefined}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
          {scannedData && (
            <View style={styles.scanSuccessOverlay}>
              <Text style={styles.scanSuccessText}>Scanned: {scannedData}</Text>
            </View>
          )}
        </View>
      </Camera>
    );
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

  const handleCancel = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setModalVisible(false);
          setScannedData(null);
          setNewLogName("");
          setIsCameraActive(true);
        })
        .catch(() => {
          // Proceed with modal close even if scanner stop fails
          setModalVisible(false);
          setScannedData(null);
          setNewLogName("");
          setIsCameraActive(true);
        });
    } else {
      setModalVisible(false);
      setScannedData(null);
      setNewLogName("");
      setIsCameraActive(true);
    }
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
            <Text style={styles.modalTitle}>Add Log Entry</Text>
            {renderCamera()}
            <TextInput
              style={styles.modalInput}
              value={newLogName}
              onChangeText={setNewLogName}
              placeholder="Or manually enter name here"
              placeholderTextColor="#666"
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddLog}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
    width: Platform.OS === "web" ? "40%" : "90%",
    maxWidth: 500,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  modalTitle: {
    color: "#6397C9",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    width: "100%",
    height: 55,
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#6397C9",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: "#FFFFFF",
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#6397C9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cameraContainer: {
    width: "100%",
    height: 450,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111111",
    overflow: "hidden",
    marginBottom: 20,
    borderRadius: 8,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#6397C9",
  },
  scanSuccessOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanSuccessText: {
    color: "#6397C9",
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#FF4444",
  },
});

export default StaffDashboard;
