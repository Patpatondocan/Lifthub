"use client";

import { useState, useEffect, useRef } from "react";
import { Camera } from "expo-camera";
import QrReader from "react-qr-reader";

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
  const qrReaderRef = useRef(null);

  useEffect(() => {
    const updateLayout = () => {
      const newIsLargeScreen = Dimensions.get("window").width >= 768;
      setIsLargeScreen(newIsLargeScreen);
      if (newIsLargeScreen) {
        setIsDrawerOpen(true);
      } else {
        setIsDrawerOpen(false);
      }
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

  //QR Code Scanner

  useEffect(() => {
    if (Platform.OS !== "web") {
      // Request camera permissions for mobile
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      })();
    }
  }, []);

  const handleScan = (data) => {
    if (data) {
      console.log("Scanned QR:", data);
      setScannedData(data);
      setNewLogName(data); // Set the scanned data as the new log name
      setIsCameraActive(false);
      setModalVisible(true); // Show confirmation modal
    }
  };

  const handleError = (error) => {
    console.error("QR Scanner error:", error);
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

  ////////////////////////////////////////

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (isLogOut) {
    return <LoginScreen />;
  }

  const handleLogout = () => {
    setIsLogOut(true);
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

  useEffect(() => {
    if (Platform.OS === "web") {
      // Initialize HTML5 QR Code Scanner for web
      const html5QrCode = new Html5QrcodeScanner(
        "qr-reader", // ID of the HTML element to render the scanner
        { fps: 10, qrbox: 250 },
        false
      );

      html5QrCodeRef.current = html5QrCode;

      html5QrCode.render(
        (data) => {
          console.log("Scanned QR:", data);
          setScannedData(data);
          setNewLogName(data); // Set the scanned data as the new log name
          setIsCameraActive(false);
          setModalVisible(true); // Show confirmation modal
          html5QrCode.clear(); // Stop the scanner after successful scan
        },
        (error) => {
          console.error("QR Scanner error:", error);
        }
      );

      return () => {
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.clear();
        }
      };
    } else {
      // Request camera permissions for mobile
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      })();
    }
  }, []);

  const renderCamera = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.cameraContainer}>
          <QrReader
            ref={qrReaderRef}
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
          />
          {scannedData && (
            <View style={styles.scanSuccessOverlay}>
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
        onBarCodeScanned={
          isCameraActive ? ({ data }) => handleScan(data) : undefined
        }
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
    <View style={styles.container}>
      {renderCamera()}

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Log Entry</Text>
            <Text style={styles.modalText}>
              Do you want to add "{newLogName}"?
            </Text>

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
    </View>
  );
};

export default AdminDashboard;
