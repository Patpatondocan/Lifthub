"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebQRCode from "qrcode.react";
import QRCodeSVG from "react-native-qrcode-svg";
import { format, differenceInDays, isBefore, parseISO } from "date-fns";

const MemberProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState("");

  const [profile, setProfile] = useState({
    id: "",
    username: "",
    name: "",
    email: "",
    contactNum: "",
    userType: "",
    membershipStatus: "",
    membershipExpiry: "",
    qrCode: "",
  });

  const [editedProfile, setEditedProfile] = useState({
    name: "",
    email: "",
    contactNum: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Replace with your actual API base URL
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub", // Android emulator
    default: "http://localhost/lifthub", // Other platforms
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const userID = await AsyncStorage.getItem("userId");
      if (!userID) throw new Error("User not logged in");

      const response = await fetch(
        `${API_BASE_URL}/get_profile.php?userID=${userID}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProfile({
          id: data.user.userID,
          username: data.user.userName,
          name: data.user.fullName,
          email: data.user.email,
          contactNum: data.user.contactNum || "Not provided",
          userType: data.user.userType,
          membershipStatus: data.user.membershipStatus || "Active",
          membershipExpiry: data.user.membershipExpiry || "N/A",
          qrCode: data.user.qrCode || `LIFTHUB-MEMBER-${data.user.userID}`,
        });
        setQrCodeValue(
          data.user.qrCode || `LIFTHUB-MEMBER-${data.user.userID}`
        );
      } else {
        throw new Error(data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditedProfile({
      name: profile.name,
      email: profile.email,
      contactNum: profile.contactNum,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!editedProfile.name.trim()) {
        Alert.alert("Error", "Name cannot be empty");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: profile.id,
          fullName: editedProfile.name,
          email: editedProfile.email,
          contactNum: editedProfile.contactNum,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setProfile({
          ...profile,
          name: editedProfile.name,
          email: editedProfile.email,
          contactNum: editedProfile.contactNum,
        });
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validate inputs
      if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
      ) {
        Alert.alert("Error", "All fields are required");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Alert.alert("Error", "New passwords do not match");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/change_password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: profile.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowPasswordForm(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        Alert.alert("Success", "Password changed successfully");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Helper to get membership status, color, and days left
  const getMembershipInfo = (expiry) => {
    if (
      !expiry ||
      expiry === "N/A" ||
      expiry === "1970-01-01" ||
      expiry === "1970-01-01T00:00:00.000Z"
    ) {
      return {
        status: "Inactive",
        color: "#888",
        daysLeft: null,
        label: "Inactive",
        showExpiry: false,
      };
    }
    let expiryDate;
    try {
      expiryDate = typeof expiry === "string" ? parseISO(expiry) : expiry;
      if (isNaN(expiryDate.getTime())) throw new Error();
    } catch {
      return {
        status: "Invalid",
        color: "#888",
        daysLeft: null,
        label: "Invalid date",
        showExpiry: false,
      };
    }
    const today = new Date();
    const daysLeft = differenceInDays(expiryDate, today);
    if (isBefore(expiryDate, today)) {
      return {
        status: "Expired",
        color: "#FF4444",
        daysLeft,
        label: "Expired",
        showExpiry: false,
      };
    } else if (daysLeft <= 7) {
      return {
        status: "Expiring Soon",
        color: "#FFD700",
        daysLeft,
        label: "Expiring Soon",
        showExpiry: true,
      };
    } else {
      return {
        status: "Active",
        color: "#4CAF50",
        daysLeft,
        label: "Active",
        showExpiry: true,
      };
    }
  };

  // QR Code renderer for member identification
  const renderQRCode = () => {
    // Ensure we have a valid QR code value, using a fallback if needed
    const qrValue = profile.qrCode || `LIFTHUB-MEMBER-${profile.id}`;

    console.log("Rendering Member QR code with value:", qrValue);

    return (
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Member ID</Text>
        <Text style={styles.qrDescription}>
          Show this QR code for gym access and identification
        </Text>

        <View style={styles.qrContainer}>
          {/* Add key prop to force re-render when value changes */}
          {Platform.OS === "web" ? (
            <WebQRCode value={qrValue} size={200} />
          ) : (
            <QRCodeSVG value={qrValue} size={200} />
          )}
        </View>
      </View>
    );
  };

  if (loading && !isEditing && !showPasswordForm) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Member Profile</Text>
          {!isEditing && !showPasswordForm && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleStartEdit}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          // Edit Profile Form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, name: text })
                  }
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={editedProfile.email}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, email: text })
                  }
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={editedProfile.contactNum}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, contactNum: text })
                  }
                  placeholder="Enter your contact number"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : showPasswordForm ? (
          // Change Password Form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, currentPassword: text })
                  }
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, newPassword: text })
                  }
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: text })
                  }
                  placeholder="Confirm new password"
                  placeholderTextColor="#666"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Change Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Profile Display
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={40} color="#FFFFFF" />
                </View>
                <View style={styles.profileInfo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Text style={styles.profileName}>{profile.name}</Text>
                    {(() => {
                      const info = getMembershipInfo(profile.membershipExpiry);
                      return (
                        <View
                          style={{
                            backgroundColor: info.color,
                            borderRadius: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            marginLeft: 10,
                            minWidth: 70,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: 13,
                              textTransform: "lowercase",
                            }}
                          >
                            {info.label} Member
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="mail-outline" size={20} color="#6397C9" />
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{profile.email}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={20} color="#6397C9" />
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{profile.contactNum}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={20} color="#6397C9" />
                  <Text style={styles.detailLabel}>Membership:</Text>
                  {(() => {
                    const info = getMembershipInfo(profile.membershipExpiry);
                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                          flexWrap: "wrap",
                          gap: 6,
                          marginLeft: 8,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: info.color,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            marginRight: 10,
                            minWidth: 70,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: 12,
                            }}
                          >
                            {info.label}
                          </Text>
                        </View>
                        {info.showExpiry ? (
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              marginRight: 10,
                            }}
                          >
                            Expires:{" "}
                            {format(
                              typeof profile.membershipExpiry === "string"
                                ? parseISO(profile.membershipExpiry)
                                : profile.membershipExpiry,
                              "MMM dd, yyyy"
                            )}
                          </Text>
                        ) : (
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              marginRight: 10,
                            }}
                          >
                            No active membership
                          </Text>
                        )}
                        {info.daysLeft !== null &&
                          info.daysLeft >= 0 &&
                          info.showExpiry && (
                            <Text
                              style={{
                                color: info.color,
                                marginLeft: 0,
                                fontWeight: "bold",
                                fontSize: 13,
                              }}
                            >
                              {info.daysLeft === 0
                                ? "(Expires today)"
                                : info.daysLeft === 1
                                ? "(1 day left)"
                                : `(${info.daysLeft} days left)`}
                            </Text>
                          )}
                      </View>
                    );
                  })()}
                </View>
              </View>
            </View>

            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>Member ID</Text>
              <Text style={styles.qrDescription}>
                Show this QR code for gym access and identification
              </Text>

              <View style={styles.qrContainer}>
                {Platform.OS === "web" ? (
                  <WebQRCode value={qrCodeValue} size={200} />
                ) : (
                  <QRCodeSVG value={qrCodeValue} size={200} />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.passwordButton}
              onPress={() => setShowPasswordForm(true)}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.passwordButtonText}>Change Password</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#333333",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6397C9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#333333",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  memberBadge: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  memberBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 15,
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6397C9",
  },
  detailLabel: {
    color: "#CCCCCC",
    width: 90, // Changed from 70 to 90 to accommodate "Membership:" text
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  qrSection: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  qrDescription: {
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#6397C9",
  },
  passwordButton: {
    backgroundColor: "#333333",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#555555",
  },
  buttonIcon: {
    marginRight: 8,
  },
  passwordButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: "#6397C9",
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "600",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#444444",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    padding: 12,
    fontSize: 15,
    fontWeight: "400",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#6397C9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: "#333333",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: "#555555",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "400",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default MemberProfileScreen;
Auiyyutrre43;
