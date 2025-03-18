"use client";

import { useState, useEffect, useRef } from "react";
import { Camera } from "expo-camera";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./AdminDashBoardStyles";
import MembersSection from "./MembersSection";
import WorkoutsSection from "./WorkoutsSection";
import TrainersSection from "./TrainersSection";
import LoginScreen from "./App";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newLogName, setNewLogName] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    Dimensions.get("window").width >= 768
  );
  const [sidebarAnimation] = useState(new Animated.Value(-280));
  const [activeSection, setActiveSection] = useState("logbook");
  const [isLogOut, setIsLogOut] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const updateLayout = () => {
      const newIsLargeScreen = Dimensions.get("window").width >= 768;
      setIsLargeScreen(newIsLargeScreen);
      if (newIsLargeScreen) {
        setIsDrawerOpen(true);
      } else {
        setIsDrawerOpen(false);
      }
      setWindowDimensions(Dimensions.get("window")); // Update window dimensions
    };

    Dimensions.addEventListener("change", updateLayout);
    updateLayout();

    return () => {
      Dimensions.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: isDrawerOpen ? 0 : -280,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDrawerOpen, sidebarAnimation]);

  // QR Code Scanner
  useEffect(() => {
    let html5QrCode = null;

    const initializeScanner = async () => {
      if (Platform.OS === "web" && modalVisible) {
        // Wait a moment for the DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 300));

        const cameraContainer = document.getElementById("qr-reader");
        if (cameraContainer) {
          try {
            html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            const config = {
              fps: 10,
              qrbox: { width: 200, height: 200 }, // Fixed size for stability
              aspectRatio: 1.0,
              transform: "scaleX(-1)", // Mirror video feed
            };

            html5QrCode
              .start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                  console.log("Scanned:", decodedText);
                  setScannedData(decodedText);
                  setNewLogName(decodedText);
                },
                (errorMessage) => {
                  if (!errorMessage.includes("NotFoundException")) {
                    console.error("QR Code Error:", errorMessage);
                  }
                }
              )
              .catch((err) => {
                console.error("Scanner start error:", err);
              });
          } catch (error) {
            console.error("Scanner initialization error:", error);
          }
        }
      }
    };

    if (modalVisible) {
      initializeScanner();
    }

    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.getState() === 2 && // 2 means SCANNING
            html5QrCodeRef.current
              .stop()
              .then(() => console.log("Scanner stopped"))
              .catch((err) => console.error("Stop error:", err));
        } catch (error) {
          console.log("Cleanup error (can be ignored):", error);
        }
        html5QrCodeRef.current = null;
      }
    };
  }, [modalVisible]);

  // Remove or modify the resize handler to avoid conflicts
  useEffect(() => {
    const handleResize = () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === 2) {
        // 2 means SCANNING
        try {
          const cameraContainer = document.getElementById("qr-reader");
          if (cameraContainer) {
            // Only update if scanner is running
            html5QrCodeRef.current.applyVideoConstraints({
              aspectRatio: 1.0,
            });
          }
        } catch (error) {
          console.log("Resize handler error (can be ignored):", error);
        }
      }
    };

    if (modalVisible) {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [modalVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (html5QrCodeRef.current) {
        const cameraContainer = document.getElementById("qr-reader");
        if (cameraContainer) {
          const width = cameraContainer.offsetWidth;
          const height = cameraContainer.offsetHeight;

          // Update the camera dimensions
          html5QrCodeRef.current.updateConfig({
            qrbox: { width: width * 0.8, height: height * 0.8 },
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Check login status when component mounts
    const checkLoginStatus = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      if (!isAuthenticated) {
        setIsLogOut(true);
      }
    };

    checkLoginStatus();
  }, []); // Empty dependency array means this runs once on mount

  const handleBarCodeScanned = ({ data }) => {
    if (isCameraActive) {
      console.log("Scanned QR:", data);
      setScannedData(data);
      setNewLogName(data); // Set the scanned data as the new log name
      setIsCameraActive(false);
      setModalVisible(true); // Show confirmation modal
    }
  };

  const handleAddLog = () => {
    if (newLogName) {
      console.log("Adding log:", newLogName);
      // Here you would typically make an API call to save the log
      setModalVisible(false);
      setScannedData(null);
      setNewLogName("");
      setIsCameraActive(true);
    }
  };

  const resetScanner = () => {
    setModalVisible(false);
    setScannedData(null);
    setNewLogName("");
    setIsCameraActive(true);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (isLogOut) {
    window.location.href = "/"; // Redirect to login page
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userType");
    setIsLogOut(true);
    // Explicitly redirect to login page
    window.location.href = "/";
    console.log("Logging out...");
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case "members":
        return <MembersSection />;
      case "workouts":
        return <WorkoutsSection />;
      case "trainers":
        return <TrainersSection />;
      case "logbook":
      default:
        return (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

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
    }
  };

  const renderSidebar = () => (
    <Animated.View
      style={[
        styles.sidebar,
        { transform: [{ translateX: sidebarAnimation }] },
      ]}
    >
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>LiftHub ADMIN</Text>
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
          <Ionicons name="book-outline" size={24} />
          <Text
            style={[
              styles.sidebarButtonText,
              activeSection === "logbook" && styles.sidebarButtonTextActive,
            ]}
          >
            Log Book
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sidebarButton,
            activeSection === "workouts" && styles.sidebarButtonActive,
          ]}
          onPress={() => setActiveSection("workouts")}
        >
          <Ionicons
            name="barbell-outline"
            size={24}
            color={activeSection === "workouts" ? "#FFFFFF" : "#6397C9"}
          />
          <Text
            style={[
              styles.sidebarButtonText,
              activeSection === "workouts" && styles.sidebarButtonTextActive,
            ]}
          >
            Workouts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sidebarButton,
            activeSection === "trainers" && styles.sidebarButtonActive,
          ]}
          onPress={() => setActiveSection("trainers")}
        >
          <Ionicons
            name="fitness-outline"
            size={24}
            color={activeSection === "trainers" ? "#FFFFFF" : "#6397C9"}
          />
          <Text
            style={[
              styles.sidebarButtonText,
              activeSection === "trainers" && styles.sidebarButtonTextActive,
            ]}
          >
            Trainers
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#6397C9" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCamera = () => {
    if (Platform.OS === "web") {
      const qrboxSize = Math.min(windowDimensions.width * 0.8, 650); // Dynamic QR box size
      return (
        <View style={styles.cameraContainer}>
          <div
            id="qr-reader"
            style={{
              width: "100%", // Fill the container
              height: "100%", // Fill the container
              background: "#111111",
              margin: "0 auto", // Center the scanner
              transform: "scaleX(-1)", // Mirror video feed
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

  return (
    <SafeAreaView style={styles.container}>
      {!isLargeScreen && (
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu-outline" size={32} color="#6397C9" />
        </TouchableOpacity>
      )}

      {renderSidebar()}

      <View
        style={[styles.mainContent, isLargeScreen && styles.mainContentLarge]}
      >
        {renderMainContent()}
      </View>

      {/* QR Scanner Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Log Entry</Text>

            {/* Camera Section */}
            {renderCamera()}

            {/* Manual Input Field */}
            <TextInput
              style={styles.modalInput}
              placeholder="Or manually enter name here"
              value={newLogName}
              onChangeText={setNewLogName}
            />

            {/* Confirm and Cancel Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddLog}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetScanner}
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

export default AdminDashboard;
