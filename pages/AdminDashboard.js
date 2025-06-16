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
  Dimensions,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import styles from "./AdminDashBoardStyles";
import MembersSection from "./MembersSection";
import WorkoutsSection from "./WorkoutsSection";
import TrainersSection from "./TrainersSection";
import FeedbackSection from "./FeedbackSection";
import { AuthContext } from "../context/AuthContext";
import { storage } from "../utils/storage";
import {
  initQRScanner,
  stopScanner,
  startScanner,
  pauseScanner,
  resumeScanner,
} from "../utils/qrUtils";
import { logout } from "../utils/auth";

const AdminDashboard = () => {
  const { userType, setIsLoggedIn } = useContext(AuthContext);
  const [currentUserType, setCurrentUserType] = useState("");
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
  const [scannedData, setScannedData] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );
  const [scanner, setScanner] = useState(null);
  const [expiringMembers, setExpiringMembers] = useState([]);
  const scannerRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    onOk: null,
  });

  // Staff Dashboard logbook state variables
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit, setLogsLimit] = useState(5); // Number of logs per page
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // State for QR scanning and user search
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showDayPassModal, setShowDayPassModal] = useState(false);
  const [dayPassName, setDayPassName] = useState("");
  const [validatingUser, setValidatingUser] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    default: "http://localhost/lifthub",
  });

  useEffect(() => {
    const loadUserType = async () => {
      try {
        const userType = await storage.getItem("userType");
        setCurrentUserType(userType || "admin");
      } catch (error) {
        console.error("Error loading user type:", error);
        setCurrentUserType("admin");
      }
    };
    loadUserType();
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const newIsLargeScreen = Dimensions.get("window").width >= 768;
      setIsLargeScreen(newIsLargeScreen);
      if (newIsLargeScreen) {
        setIsDrawerOpen(true);
      } else {
        setIsDrawerOpen(false);
      }
      setWindowDimensions(Dimensions.get("window"));
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

  // Update the initScanner function
  const initScanner = async () => {
    if (Platform.OS === "web" && modalVisible) {
      try {
        // Show initial status
        setScanStatus("Initializing camera...");

        const scanner = await initQRScanner(
          "qr-reader",
          handleQrScanned,
          (error) => {
            // This will only be called for non-normal errors now
            console.error("QR Error:", error);
            // Only update UI for serious errors
            if (
              error.includes("NotAllowedError") ||
              error.includes("permission")
            ) {
              setScanStatus("Camera access denied. Please check permissions.");
            } else if (
              error.includes("NotFoundError") ||
              error.includes("NotReadableError")
            ) {
              setScanStatus("No camera found or camera is not accessible.");
            } else if (error.includes("AbortError")) {
              setScanStatus("Camera initialization was aborted.");
            }
          }
        );

        setScanner(scanner);

        // Now start the scanner after initialization
        if (scanner) {
          const started = await startScanner(scanner);
          if (started) {
            setScanStatus("Camera ready. Point at a QR code.");
          } else {
            setScanStatus("Failed to start camera. Please try again.");
          }
        } else {
          setScanStatus("Failed to initialize camera. Please try again.");
        }
      } catch (error) {
        console.error("Scanner init error:", error);
        setScanStatus("Camera error: " + (error.message || "Unknown error"));
      }
    }
  };

  useEffect(() => {
    // Replace the old initialization code with the new initScanner call
    if (modalVisible) {
      initScanner();
    }

    return () => {
      if (scanner) {
        stopScanner(scanner);
      }
    };
  }, [modalVisible]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated");
      if (!isAuthenticated) {
        setIsLogOut(true);
      }
    };

    checkLoginStatus();
  }, []);

  // Callback function to receive expiring members from MembersSection
  const handleExpiringMembersUpdate = (expiringMembersList) => {
    setExpiringMembers(expiringMembersList);
  };

  // Function to fetch logs
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

  // Effect to fetch logs when component mounts or activeSection changes to logbook
  useEffect(() => {
    if (activeSection === "logbook") {
      fetchLogs(logSearchQuery);
    }
  }, [activeSection]);

  // Function to search logs
  const handleLogSearch = (query) => {
    setLogSearchQuery(query);
    fetchLogs(query, 0); // Reset to first page when searching
  };

  // Function to format the log date
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

  // Function to validate QR code and create log
  const validateUserQRAndCreateLog = async (qrCode) => {
    setValidatingUser(true);
    setScanStatus("Validating QR code...");

    try {
      // Call API to validate QR code
      const response = await fetch(
        `${API_BASE_URL}/validate_qr_code.php?qrCode=${encodeURIComponent(
          qrCode
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.userExists) {
          // User exists in the system
          setFoundUser(data.user);

          if (data.alreadyEntered) {
            // User has already entered the gym today
            setScanStatus(
              `${data.user.fullName} has already entered the gym today.`
            );
            setTimeout(() => {
              setModalVisible(false);
              setFoundUser(null);
              setScannedData(null);
              setNewLogName("");
              setScanStatus("");
            }, 2500);
            return;
          }

          // Create log entry for member/trainer
          await createLogEntry(data.user.userID);
          setScanStatus(
            `${data.user.fullName} (${data.user.userType}) has entered the gym`
          );

          // Refresh logs
          fetchLogs(logSearchQuery);

          // Close modal after 2 seconds
          setTimeout(() => {
            setModalVisible(false);
            setFoundUser(null);
            setScannedData(null);
            setNewLogName("");
            setScanStatus("");
          }, 2000);
        } else if (data.isDayPass) {
          // It's a day pass QR code
          createDayPassEntry(data.name);
        } else {
          // User not found, show day pass option
          setDayPassName(qrCode.replace(/^LIFTHUB-[-\w]*-/, ""));
          setShowDayPassModal(true);
        }
      } else {
        throw new Error(data.message || "Validation failed");
      }
    } catch (error) {
      console.error("QR validation error:", error);
      setScanStatus(`Error: ${error.message}`);
      setTimeout(() => setScanStatus(""), 3000);
    } finally {
      setValidatingUser(false);
    }
  };

  // Function to create a log entry when user enters the gym
  const createLogEntry = async (userId) => {
    try {
      const admin_id = await storage.getItem("userId");

      const response = await fetch(`${API_BASE_URL}/add_entry_log.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          loggedBy: admin_id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.alreadyEntered) {
          setScanStatus(data.message);
        } else {
          throw new Error(data.message || "Failed to create log entry");
        }
      }

      return data;
    } catch (error) {
      console.error("Log creation error:", error);
      throw error;
    }
  };

  // Function to create a day pass entry
  const createDayPassEntry = async (name) => {
    try {
      const admin_id = await storage.getItem("userId");

      const response = await fetch(`${API_BASE_URL}/add_entry_log.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDayPass: true,
          visitorName: name,
          loggedBy: admin_id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScanStatus(`${name} has entered the gym with a day pass`);

        // Refresh logs
        fetchLogs(logSearchQuery);

        // Close modal after 2 seconds
        setTimeout(() => {
          setModalVisible(false);
          setScannedData(null);
          setNewLogName("");
          setScanStatus("");
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to create day pass entry");
      }
    } catch (error) {
      console.error("Day pass creation error:", error);
      setScanStatus(`Error: ${error.message}`);
      setTimeout(() => setScanStatus(""), 3000);
    }
  };

  // Handle manual name search
  const handleManualNameSearch = async (text) => {
    setNewLogName(text);

    if (text.length < 2) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/search_users.php?query=${encodeURIComponent(text)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.users);
      } else {
        throw new Error(data.message || "Failed to search users");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle QR code scanning with pause/resume capability
  const handleQrScanned = (decodedText) => {
    try {
      console.log("Scanned QR:", decodedText);

      // Ignore empty scans
      if (!decodedText || decodedText.trim() === "") {
        console.warn("Empty QR code data detected");
        return;
      }

      // Set state with scanned data
      setScannedData(decodedText);
      setNewLogName(decodedText);
      setScanStatus("QR code detected! Processing...");

      // Process the QR code
      validateUserQRAndCreateLog(decodedText);
    } catch (error) {
      console.error("Error processing scanned QR code:", error);
      setScanStatus("Error processing QR code. Try again.");

      // Resume scanning after error
      if (scanner) {
        resumeScanner(scanner);
      }
    }
  };

  // Add a reset function to clear scan and restart scanning
  const resetScanner = () => {
    // Clear state
    setScannedData(null);
    setNewLogName("");
    setScanStatus("Camera ready. Point at a QR code.");
    setShowDayPassModal(false);
    setSearchResults([]);
    setFoundUser(null);

    // Resume scanning
    if (scanner) {
      resumeScanner(scanner);
    }
  };

  // Update the closeModal function to properly clean up
  const closeModal = () => {
    // Stop the scanner when closing the modal
    if (scanner) {
      stopScanner(scanner);
    }

    // Reset state
    setModalVisible(false);
    setScannedData(null);
    setNewLogName("");
    setScanStatus("");
    setShowDayPassModal(false);
    setSearchResults([]);
    setFoundUser(null);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (isLogOut) {
    window.location.href = "/";
    return null;
  }

  const handleLogout = async () => {
    const success = await logout(setIsLoggedIn);
    if (!success) {
      showAlert("Error", "Failed to logout. Please try again.");
    }
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  useEffect(() => {
    if (modalVisible) {
      initScanner();
    }

    return () => {
      if (scanner) {
        stopScanner(scanner);
      }
    };
  }, [modalVisible]);

  const renderMainContent = () => {
    switch (activeSection) {
      case "members":
        return (
          <MembersSection
            onExpiringMembersUpdate={handleExpiringMembersUpdate}
          />
        );
      case "workouts":
        return <WorkoutsSection />;
      case "trainers":
        return <TrainersSection />;
      case "feedback":
        return <FeedbackSection />;
      case "logbook":
      default:
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

            <View style={styles.logBookContainer}>
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
                            <Text style={styles.logActionText}>
                              {log.action}
                            </Text>
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
                </ScrollView>
              )}
            </View>

            {logs.length > 0 && logsTotal > logsLimit && (
              <View style={styles.paginationContainer}>
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
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={logsOffset === 0 ? "#444" : "#FFF"}
                  />
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                  {logsOffset + 1}-{Math.min(logsOffset + logsLimit, logsTotal)}{" "}
                  of {logsTotal}
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
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={
                      logsOffset + logsLimit >= logsTotal ? "#444" : "#FFF"
                    }
                  />
                </TouchableOpacity>
              </View>
            )}
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
        <TouchableOpacity
          style={[
            styles.sidebarButton,
            activeSection === "feedback" && styles.sidebarButtonActive,
          ]}
          onPress={() => setActiveSection("feedback")}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color={activeSection === "feedback" ? "#FFFFFF" : "#6397C9"}
          />
          <Text style={styles.sidebarButtonText}>Feedback</Text>
        </TouchableOpacity>

        {/* Add Expiring Members Box - only show when members section is active */}
        {activeSection === "members" && expiringMembers.length > 0 && (
          <View style={styles.expiringMembersBox}>
            <View style={styles.expiringMembersHeader}>
              <Ionicons name="warning" size={18} color="#FFD700" />
              <Text style={styles.expiringMembersTitle}>
                Memberships Expiring Soon (Within 7 Days)
              </Text>
            </View>

            <View style={styles.expiringMembersList}>
              {expiringMembers.map((member) => {
                // Check if membership has already expired compared to the current date
                const expiryDate = new Date(member.membership);
                const today = new Date(); // Get the current date from the system
                const isExpired = expiryDate < today;

                return (
                  <View key={member.id} style={styles.expiringMemberItem}>
                    <Ionicons
                      name="person"
                      size={14}
                      color={isExpired ? "#FF0000" : "#FFD700"}
                    />
                    <Text
                      style={[
                        styles.expiringMemberText,
                        isExpired && { color: "#FF0000" },
                      ]}
                    >
                      {member.name} - {isExpired ? "Expired on " : "Expires "}
                      {format(expiryDate, "MMM dd, yyyy")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#6397C9" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Update the renderModal function to include all new scanning functionality
  const renderQRModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showDayPassModal ? "Visitor Day Pass" : "Gym Entry"}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {showDayPassModal ? (
            <View style={styles.dayPassContainer}>
              <Ionicons
                name="ticket-outline"
                size={40}
                color="#6397C9"
                style={styles.dayPassIcon}
              />
              <Text style={styles.dayPassTitle}>
                Visitor not found in system
              </Text>
              <Text style={styles.dayPassSubtitle}>
                Would you like to issue a day pass for this visitor?
              </Text>
              <TextInput
                style={styles.dayPassInput}
                placeholder="Visitor name"
                placeholderTextColor="#666"
                value={dayPassName}
                onChangeText={setDayPassName}
              />
              <View style={styles.dayPassButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowDayPassModal(false);
                    initScanner();
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleDayPassConfirm}
                  disabled={!dayPassName.trim()}
                >
                  <Text style={styles.modalButtonText}>Issue Day Pass</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Manual entry field */}
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
                    placeholder="Scan QR code or search by name"
                    placeholderTextColor="#666"
                    value={newLogName}
                    onChangeText={handleManualNameSearch}
                  />
                  {newLogName ? (
                    <TouchableOpacity
                      onPress={() => {
                        setNewLogName("");
                        setSearchResults([]);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Search results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleSelectUser(item)}
                      >
                        <Ionicons
                          name={
                            item.userType === "member" ? "person" : "fitness"
                          }
                          size={24}
                          color="#6397C9"
                        />
                        <View style={styles.searchResultTextContainer}>
                          <Text style={styles.searchResultName}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.searchResultUsername}>
                            @{item.userName} ({item.userType})
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.searchResultsList}
                  />
                </View>
              )}

              {/* QR Scanner */}
              {!scannedData && !foundUser && (
                <View style={styles.cameraContainer}>
                  <div
                    id="qr-reader"
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "650px",
                      margin: "0 auto",
                    }}
                  />
                </View>
              )}

              {/* Scan status/result */}
              {(scannedData || foundUser || scanStatus) && (
                <View style={styles.scanStatusContainer}>
                  {foundUser ? (
                    <View style={styles.foundUserContainer}>
                      <Ionicons
                        name={
                          foundUser.userType === "member"
                            ? "person-circle"
                            : "fitness"
                        }
                        size={40}
                        color="#4CAF50"
                      />
                      <Text style={styles.foundUserName}>
                        {foundUser.fullName}
                      </Text>
                      <Text style={styles.foundUserDetails}>
                        {foundUser.userType} • {foundUser.userName}
                      </Text>
                    </View>
                  ) : null}
                  {scanStatus ? (
                    <Text style={styles.scanStatusText}>{scanStatus}</Text>
                  ) : null}
                  {validatingUser && (
                    <ActivityIndicator size="small" color="#6397C9" />
                  )}
                </View>
              )}

              {/* Manual entry button */}
              {!scannedData &&
              !foundUser &&
              !searchResults.length &&
              newLogName.trim() ? (
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={() => {
                    setDayPassName(newLogName);
                    setShowDayPassModal(true);
                  }}
                >
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.manualEntryButtonText}>
                    Create Day Pass for "{newLogName}"
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

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
      {renderQRModal()}

      {/* Custom Alert Modal */}
      <Modal
        visible={showAlertModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Alert</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Legacy Alert Modal (keeping for compatibility) */}
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

export default AdminDashboard;
