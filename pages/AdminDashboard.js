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

  // Add a state variable to track if scanning is allowed
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState("");

  // Function to determine QR reader size based on window dimensions
  const getQRReaderSize = () => {
    const width = windowDimensions.width;
    if (width < 500) {
      return styles.qrReaderSmall;
    } else if (width < 768) {
      return styles.qrReaderMedium;
    }
    return {};
  };

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

  // Prevent concurrent scanner initializations
  const scannerInitInProgress = useRef(false);

  // Update the scanner initialization logic to ensure the async scan handler is used
  const initScanner = async () => {
    if (Platform.OS === "web" && modalVisible && scanningEnabled) {
      if (scannerInitInProgress.current) return;
      scannerInitInProgress.current = true;
      try {
        setScanStatus("Initializing camera...");

        // Clean up any existing scanner
        if (scanner) {
          await stopScanner(scanner);
          setScanner(null);
        }

        // Retry finding the QR reader element up to 10 times
        let qrReaderDiv = null;
        for (let i = 0; i < 10; i++) {
          qrReaderDiv = document.getElementById("qr-reader");
          if (qrReaderDiv) break;
          await new Promise((res) => setTimeout(res, 100));
        }
        if (!qrReaderDiv) {
          console.error("QR reader div not found in DOM");
          setScanStatus("QR reader element not found. Please reload the page.");
          scannerInitInProgress.current = false;
          return null;
        }

        // Create a new scanner instance
        const newScanner = await initQRScanner(
          "qr-reader",
          handleQrScannedSafely, // Always use the main scan handler
          (error) => {
            // Suppress parse errors from being shown to users
            if (
              error.includes(
                "No MultiFormat Readers were able to detect the code"
              ) ||
              error.includes("parse error")
            ) {
              // Silently ignore parse errors
              return;
            }

            // Handle known camera errors with user-friendly messages
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
            } else {
              // For all other errors, show a generic message
              console.error("Scanner error:", error);
              setScanStatus("Scanner error occurred. Please try again.");
            }
          }
        );

        setScanner(newScanner);

        // Start the scanner
        const started = await startScanner(
          newScanner,
          handleQrScannedSafely,
          (error) => {
            console.error("Error starting scanner:", error);
            setScanStatus("Scanner error: " + error);
          }
        );

        if (started) {
          setScanStatus("Camera ready. Point at a QR code.");
          scannerInitInProgress.current = false;
          return newScanner;
        } else {
          setScanStatus("Failed to start camera. Please try again.");
          scannerInitInProgress.current = false;
          return null;
        }
      } catch (error) {
        console.error("Scanner initialization error:", error);
        setScanStatus("Camera error: " + (error.message || "Unknown error"));
        scannerInitInProgress.current = false;
        return null;
      }
    }
    return null;
  };

  // Add a helper to get the full QR code from a base code
  const getFullQrCodeForUser = async (baseQrCode) => {
    try {
      // Search for the user by the base QR code (assume it's unique enough)
      const response = await fetch(
        `${API_BASE_URL}/search_users.php?query=${encodeURIComponent(
          baseQrCode
        )}`
      );
      const data = await response.json();
      if (data.success && data.users && data.users.length > 0) {
        // Find the user whose qrCode starts with the base code
        const user = data.users.find(
          (u) => u.qrCode && u.qrCode.startsWith(baseQrCode)
        );
        if (user && user.qrCode) {
          return user.qrCode;
        }
      }
      return null;
    } catch (err) {
      console.error("Error fetching user for QR code lookup:", err);
      return null;
    }
  };

  // Update the scan handler to use the full QR code if only the base is scanned
  const handleQrScannedSafely = async (decodedText) => {
    try {
      if (!decodedText || decodedText.trim() === "") {
        return;
      }

      // Prevent multiple scans at once
      if (!scanningEnabled) return;

      // Immediately disable scanning to prevent duplicates
      setScanningEnabled(false);

      // Update UI with scanned data
      setScannedData(decodedText);
      setNewLogName(decodedText);
      setScanStatus("QR code detected! Processing...");

      let qrToValidate = decodedText;
      if (!/-\d+$/.test(decodedText)) {
        // If it doesn't end with -<digits>, treat as base
        const fullQr = await getFullQrCodeForUser(decodedText);
        if (fullQr) {
          qrToValidate = fullQr;
        } else {
          setScanStatus("No matching user found for scanned code.");
          const t = setTimeout(() => {
            setScanningEnabled(true);
            setScannedData(null);
            setFoundUser(null);
          }, 2000);
          closeTimeouts.current.push(t);
          return;
        }
      }

      // Process the QR code
      await validateUserQRAndCreateLog(qrToValidate);

      // Don't close the modal here - let validateUserQRAndCreateLog handle that
      // Just re-enable scanning so the next scan works
      const t = setTimeout(() => {
        setScanningEnabled(true);
        setScannedData(null);
        setFoundUser(null);
      }, 2000);
      closeTimeouts.current.push(t);
    } catch (error) {
      console.error("Error in QR scan handler:", error);
      setScanStatus("Error processing QR code: " + error.message);

      // Re-enable scanning after error
      const t = setTimeout(() => {
        setScanningEnabled(true);
      }, 2000);
      closeTimeouts.current.push(t);
    }
  };

  // Replace handleQrScanned with this safeguard function
  const handleQrScanned = handleQrScannedSafely;

  // Track timeouts to prevent modal from closing unexpectedly
  const closeTimeouts = useRef([]);

  // Clear all pending timeouts
  const clearCloseTimeouts = () => {
    closeTimeouts.current.forEach((t) => clearTimeout(t));
    closeTimeouts.current = [];
  };

  // Function to fix the issue with repeated scanning
  const handleScanAgain = () => {
    // Reset scanning state to allow for another scan
    setScannedData(null);
    setFoundUser(null);
    setScanStatus("Ready for next scan");
    setScanningEnabled(true);

    // Re-initialize scanner if needed
    if (!scanner) {
      initScanner();
    }
  };

  // Update closeModal function for robust scanner cleanup
  const closeModal = () => {
    // Clear any pending timeouts
    clearCloseTimeouts();

    // Disable scanning and reset scan-related state
    setScanningEnabled(false);
    setScannedData(null);
    setNewLogName("");
    setScanStatus("");
    setShowDayPassModal(false);
    setSearchResults([]);
    setFoundUser(null);
    setValidatingUser(false);

    // Clean up scanner
    if (scanner) {
      stopScanner(scanner).catch((e) =>
        console.error("Error stopping scanner:", e)
      );
      setScanner(null);
    }

    // Close the modal
    setModalVisible(false);

    // Enable scanning again after modal is fully closed
    const t = setTimeout(() => setScanningEnabled(true), 500);
    closeTimeouts.current.push(t);
  };

  // When opening the modal, always clear timeouts and re-enable scanning
  useEffect(() => {
    if (modalVisible) {
      // Clear any pending timeouts from previous sessions
      clearCloseTimeouts();

      // Ensure scanning is enabled for the new session
      setScanningEnabled(true);

      // Reset scan state
      setScannedData(null);
      setFoundUser(null);
      setScanStatus("Getting camera ready...");

      // Use requestAnimationFrame to ensure DOM is rendered before initializing scanner
      const raf = requestAnimationFrame(() => {
        // Small timeout to ensure DOM is fully ready
        setTimeout(() => {
          initScanner();
        }, 100);
      });

      return () => {
        // Clean up on modal close or component unmount
        cancelAnimationFrame(raf);
        clearCloseTimeouts();

        if (scanner) {
          stopScanner(scanner).catch(() => {});
        }
      };
    } else {
      // When modal is closed, make sure to cleanup
      if (scanner) {
        stopScanner(scanner).catch(() => {});
        setScanner(null);
      }

      // Clear state on modal close
      setScannedData(null);
      setFoundUser(null);
    }
  }, [modalVisible]);

  // MutationObserver-based scanner initialization for web
  useEffect(() => {
    if (Platform.OS !== "web" || !modalVisible) return;
    let observer = null;
    let initialized = false;

    function tryInit() {
      const parent = document.querySelector(".cameraContainer");
      if (parent && !initialized) {
        initialized = true;
        initScanner();
        if (observer) observer.disconnect();
      }
    }

    // Try immediately in case it's already there
    tryInit();

    if (!initialized) {
      observer = new MutationObserver(() => {
        tryInit();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) observer.disconnect();
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
            if (scanner) {
              stopScanner(scanner).catch(() => {});
              setScanner(null);
            }
            setScanningEnabled(false);
            setModalVisible(false);
            setInfoModalContent(
              `${data.user.fullName} has already entered the gym today.`
            );
            setInfoModalVisible(true);
            return;
          }

          // Create log entry for member/trainer
          await createLogEntry(data.user.userID);
          setScanStatus(
            `${data.user.fullName} (${data.user.userType}) has entered the gym`
          );
          fetchLogs(logSearchQuery);
          if (scanner) {
            stopScanner(scanner).catch(() => {});
            setScanner(null);
          }
          setScanningEnabled(false);
          setModalVisible(false);
          setInfoModalContent(
            `${data.user.fullName} (${data.user.userType}) has entered the gym`
          );
          setInfoModalVisible(true);
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
      if (scanner) {
        stopScanner(scanner).catch(() => {});
        setScanner(null);
      }
      setScanningEnabled(false);
      setModalVisible(false);
      setInfoModalContent(`Error: ${error.message}`);
      setInfoModalVisible(true);
    } finally {
      setValidatingUser(false);
    }
  };

  // Function to create a log entry when user enters the gym
  const createLogEntry = async (userId) => {
    try {
      const admin_id = await storage.getItem("userId");
      const payload = {
        userId: userId,
        loggedBy: admin_id,
      };

      const response = await fetch(`${API_BASE_URL}/add_entry_log.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        fetchLogs(logSearchQuery);
        if (scanner) {
          stopScanner(scanner).catch(() => {});
          setScanner(null);
        }
        setScanningEnabled(false);
        setModalVisible(false);
        setInfoModalContent(`${name} has entered the gym with a day pass`);
        setInfoModalVisible(true);
      } else {
        throw new Error(data.message || "Failed to create day pass entry");
      }
    } catch (error) {
      console.error("Day pass creation error:", error);
      setScanStatus(`Error: ${error.message}`);
      if (scanner) {
        stopScanner(scanner).catch(() => {});
        setScanner(null);
      }
      setScanningEnabled(false);
      setModalVisible(false);
      setInfoModalContent(`Error: ${error.message}`);
      setInfoModalVisible(true);
    }
  };

  // Add missing function for day pass confirmation
  const handleDayPassConfirm = async () => {
    if (!dayPassName.trim()) {
      setScanStatus("Please enter a visitor name");
      return;
    }

    createDayPassEntry(dayPassName);
    setShowDayPassModal(false);
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

  // Add missing function for handling user selection from search
  const handleSelectUser = async (user) => {
    setFoundUser(user);
    setNewLogName(user.fullName);
    setScanStatus(`User found: ${user.fullName}`);

    try {
      await createLogEntry(user.id);
      setScanStatus(`${user.fullName} (${user.userType}) has entered the gym`);
      fetchLogs(logSearchQuery);
      if (scanner) {
        stopScanner(scanner).catch(() => {});
        setScanner(null);
      }
      setScanningEnabled(false);
      setModalVisible(false);
      setInfoModalContent(
        `${user.fullName} (${user.userType}) has entered the gym`
      );
      setInfoModalVisible(true);
    } catch (error) {
      setScanStatus(`Error: ${error.message}`);
      if (scanner) {
        stopScanner(scanner).catch(() => {});
        setScanner(null);
      }
      setScanningEnabled(false);
      setModalVisible(false);
      setInfoModalContent(`Error: ${error.message}`);
      setInfoModalVisible(true);
    }
  };

  // Helper to open the scan modal and reset all scan state
  const openScanModal = () => {
    setNewLogName("");
    setScannedData(null);
    setFoundUser(null);
    setScanStatus("Getting camera ready...");
    setShowDayPassModal(false);
    setSearchResults([]);
    setValidatingUser(false);
    setScanningEnabled(true);
    setModalVisible(true);
  };

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
                onPress={openScanModal}
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

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  if (isLogOut) {
    window.location.href = "/";
    return null;
  }

  // Define handleLogout function properly
  const handleLogout = async () => {
    try {
      const success = await logout(setIsLoggedIn);
      if (!success) {
        showAlert("Error", "Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      showAlert("Error", "An unexpected error occurred during logout.");
    }
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // Make sure renderSidebar can access handleLogout
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
                  onPress={closeModal}
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
                    placeholder="Search by name"
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
              {Platform.OS === "web" && !scannedData && !foundUser && (
                <div className="cameraContainer" style={styles.cameraContainer}>
                  <div
                    id="qr-reader"
                    style={{
                      ...styles.qrReader,
                      ...getQRReaderSize(),
                    }}
                  />
                </div>
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

  // Info Modal
  const renderInfoModal = () => (
    <Modal
      visible={infoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setInfoModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Scan Result</Text>
          <Text style={styles.scanStatusText}>{infoModalContent}</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setInfoModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
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

      {/* Info Modal */}
      {renderInfoModal()}

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
