"use client";

import { useState, useEffect, useRef, useContext } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MembersSection from "./MembersSection";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";

const StaffDashboard = () => {
  const [currentUserType, setCurrentUserType] = useState("");
  const [activeSection, setActiveSection] = useState("logbook");
  const [modalVisible, setModalVisible] = useState(false);
  const [newLogName, setNewLogName] = useState("");
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    onOk: null,
  });
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit, setLogsLimit] = useState(6); // Changed from 20 to 6
  const html5QrCodeRef = useRef(null);
  const { setIsLoggedIn } = useContext(AuthContext);

  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    default: "http://localhost/lifthub",
  });

  useEffect(() => {
    const loadUserType = async () => {
      const userType = await AsyncStorage.getItem("userType");
      setCurrentUserType(userType || "staff");
    };
    loadUserType();
  }, []);

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

  const showAlert = (title, message, onOk = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      onOk,
    });
  };

  const handleLogout = async () => {
    try {
      const success = await logout(setIsLoggedIn);
      if (!success) {
        showAlert("Error", "Failed to logout. Please try again.");
      }
    } catch (error) {
      showAlert("Error", error.message);
    }
  };

  const fetchLogs = async (searchQuery = "", offset = 0) => {
    setLogsLoading(true);
    setLogsError(null);

    try {
      const url = `${API_BASE_URL}/get_logs.php?limit=${logsLimit}&offset=${offset}${
        searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setLogsTotal(data.total);
        setLogsOffset(offset);
      } else {
        throw new Error(data.error || "Failed to fetch logs");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogsError(error.message);
    } finally {
      setLogsLoading(false);
    }
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

  const handleLogSearch = (query) => {
    setLogSearchQuery(query);
    fetchLogs(query);
  };

  const formatLogDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

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

        <View style={styles.contentContainer}>
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
                placeholder="Search logs..."
                placeholderTextColor="#666"
                value={logSearchQuery}
                onChangeText={handleLogSearch}
              />
              {logSearchQuery ? (
                <TouchableOpacity onPress={() => handleLogSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {logsLoading ? (
            <View style={styles.logsLoadingContainer}>
              <ActivityIndicator size="large" color="#6397C9" />
              <Text style={styles.loadingText}>Loading logs...</Text>
            </View>
          ) : logsError ? (
            <View style={styles.logsErrorContainer}>
              <Text style={styles.errorText}>Error: {logsError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchLogs(logSearchQuery)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.logBook}>
              {logs.length === 0 ? (
                <View style={styles.emptyLogsContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color="#666"
                  />
                  <Text style={styles.emptyLogsText}>
                    No logs found
                    {logSearchQuery ? ` matching "${logSearchQuery}"` : ""}
                  </Text>
                </View>
              ) : (
                logs.map((log) => (
                  <View key={log.id} style={styles.logEntry}>
                    <View style={styles.logHeader}>
                      <View style={styles.logAction}>
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color="#6397C9"
                        />
                        <Text style={styles.logActionText}>{log.action}</Text>
                      </View>
                      <Text style={styles.logDate}>
                        {formatLogDate(log.dateTime)}
                      </Text>
                    </View>
                    <Text style={styles.logInfo}>{log.info}</Text>
                    <View style={styles.logFooter}>
                      <Text style={styles.logUser}>
                        By: {log.fullName} ({log.userName})
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {logs.length > 0 && logsTotal > logsLimit && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      logsOffset === 0 && styles.paginationButtonDisabled,
                    ]}
                    onPress={() =>
                      fetchLogs(
                        logSearchQuery,
                        Math.max(0, logsOffset - logsLimit)
                      )
                    }
                    disabled={logsOffset === 0}
                  >
                    <Text style={styles.paginationButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={styles.paginationInfo}>
                    {logsOffset + 1}-
                    {Math.min(logsOffset + logsLimit, logsTotal)} of {logsTotal}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      logsOffset + logsLimit >= logsTotal &&
                        styles.paginationButtonDisabled,
                    ]}
                    onPress={() =>
                      fetchLogs(logSearchQuery, logsOffset + logsLimit)
                    }
                    disabled={logsOffset + logsLimit >= logsTotal}
                  >
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
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

      {/* Add Alert Modal */}
      <Modal
        visible={alertConfig.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() =>
          setAlertConfig((prev) => ({ ...prev, visible: false }))
        }
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                if (alertConfig.onOk) alertConfig.onOk();
                setAlertConfig((prev) => ({ ...prev, visible: false }));
              }}
            >
              <Text style={styles.alertButtonText}>OK</Text>
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
  contentContainer: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#6397C9",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#FFFFFF",
    fontSize: 16,
  },
  logsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  logsErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyLogsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyLogsText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  logEntry: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#6397C9",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  logActionText: {
    color: "#6397C9",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  logDate: {
    color: "#888",
    fontSize: 12,
  },
  logInfo: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  logFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  logUser: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
  },
  logBook: {
    flex: 1,
    marginTop: 10,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  paginationButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: "#222",
    opacity: 0.5,
  },
  paginationButtonText: {
    color: "#FFF",
    fontSize: 14,
  },
  paginationInfo: {
    color: "#888",
    marginHorizontal: 10,
    fontSize: 14,
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
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  alertTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  alertMessage: {
    color: "#CCCCCC",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default StaffDashboard;
