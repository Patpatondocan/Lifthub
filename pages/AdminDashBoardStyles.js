// Here's the updated AdminDashBoardStyles.js file with the new styles for QR scanning and user search

import { StyleSheet, Platform, StatusBar, Dimensions } from "react-native";

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
  menuButton: {
    position: "absolute",
    top: Platform.OS === "web" ? 20 : 15,
    left: 15,
    zIndex: 10,
    padding: 8,
  },
  sidebar: {
    width: 280,
    backgroundColor: "#111111",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    elevation: 5,
    ...(Platform.OS === "web"
      ? { boxShadow: "2px 0 5px rgba(0,0,0,0.25)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        }),
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: Platform.OS === "web" ? 20 : 10,
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
  sidebarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 12,
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
    paddingTop: Platform.OS === "web" ? 20 : 15,
  },
  mainContentLarge: {
    marginLeft: 280,
  },
  searchContainer: {
    marginBottom: 20,
    paddingTop: Platform.OS === "web" ? 0 : 10,
    paddingHorizontal: Platform.OS === "web" ? 0 : 15,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    height: "100%",
  },
  logBookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: Platform.OS === "web" ? 0 : 15,
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
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 4px rgba(99,151,201,0.3)" }
      : {
          shadowColor: "#6397C9",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }),
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  logBookContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  logBook: {
    flex: 1,
    paddingHorizontal: Platform.OS === "web" ? 0 : 15,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#111111",
  },
  paginationButton: {
    backgroundColor: "#2A2A2A",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: "#1A1A1A",
    opacity: 0.5,
  },
  paginationInfo: {
    color: "#CCCCCC",
    marginHorizontal: 12,
    fontSize: 14,
    minWidth: 100,
    textAlign: "center",
  },

  // Camera styles
  cameraContainer: {
    width: "100%",
    aspectRatio: 4 / 3, // Using aspect ratio instead of fixed height
    maxHeight: 450,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111111",
    overflow: "hidden",
    marginBottom: 20,
    borderRadius: 8,
    position: "relative", // Added for absolute positioning of children
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraOverlay: {
    position: "absolute", // Changed to absolute positioning
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  // Add responsive styles for different screen sizes
  qrReaderWrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  qrReader: {
    width: "100%",
    maxWidth: "650px",
    height: "100%",
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
  },
  qrReaderSmall: {
    maxWidth: "100%",
    maxHeight: "300px",
  },
  qrReaderMedium: {
    maxWidth: "450px",
  },

  // Modal styles - improved for modern look
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#6397C9",
    textAlign: "center",
    marginBottom: 20,
    width: "100%",
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
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    height: 50,
    elevation: 5,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }),
  },
  cancelButton: {
    backgroundColor: "#FF4444",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  scannerContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    alignItems: "center",
  },
  expiringMembersBox: {
    backgroundColor: "#2A1810",
    marginTop: 15,
    marginHorizontal: 10,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  expiringMembersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  expiringMembersTitle: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
  expiringMembersList: {
    gap: 4,
  },
  expiringMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  expiringMemberText: {
    color: "#FFFFFF",
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },

  // Log book specific styles
  logsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  logsErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6397C9",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyLogsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyLogsText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
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
    fontSize: 16,
    marginLeft: 8,
  },
  logDate: {
    color: "#999",
    fontSize: 14,
  },
  logInfo: {
    color: "#FFFFFF",
    marginBottom: 10,
  },
  logFooter: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 8,
  },
  logUser: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  alertTitle: {
    color: "#6397C9",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  alertMessage: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#6397C9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // QR Scanning and user search styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  searchResultsContainer: {
    maxHeight: 200,
    width: "100%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
  },
  searchResultsList: {
    width: "100%",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchResultTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultName: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  searchResultUsername: {
    color: "#999",
    fontSize: 14,
  },
  scanStatusContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    padding: 15,
    backgroundColor: "#1D1D1D",
    borderRadius: 8,
    marginBottom: 15,
  },
  scanStatusText: {
    color: "#6397C9",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  foundUserContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  foundUserName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  foundUserDetails: {
    color: "#6397C9",
    fontSize: 16,
  },
  manualEntryButton: {
    flexDirection: "row",
    backgroundColor: "#6397C9",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  manualEntryButtonText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  dayPassContainer: {
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
  },
  dayPassIcon: {
    marginBottom: 15,
  },
  dayPassTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dayPassSubtitle: {
    color: "#CCCCCC",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  dayPassInput: {
    width: "100%",
    backgroundColor: "#2A2A2A",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  dayPassButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  resetScanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6397C9",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  resetScanButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
});

export default styles;
