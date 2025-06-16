"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QRCodeComponent } from "../../utils/qrUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TrainerProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [profile, setProfile] = useState({
    id: "",
    username: "",
    name: "",
    email: "",
    contactNum: "",
    userType: "",
    assignedTrainees: 0,
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
          contactNum: data.user.contactNum,
          userType: data.user.userType,
          assignedTrainees: data.user.assignedTrainees || 0,
          qrCode: data.user.qrCode || `LIFTHUB-TRAINER-${data.user.userID}`,
        });
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

  const renderQRCode = () => {
    // Ensure we have a valid QR code value, using a fallback if needed
    const qrValue = profile.qrCode || `LIFTHUB-TRAINER-${profile.id}`;

    console.log("Rendering Trainer QR code with value:", qrValue);

    return (
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Trainer ID</Text>
        <Text style={styles.qrDescription}>
          Show this QR code for gym access and identification
        </Text>

        <View style={styles.qrContainer}>
          {/* Add key prop to force re-render when value changes */}
          <QRCodeComponent value={qrValue} size={200} key={qrValue} />
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
          <Text style={styles.title}>Trainer Profile</Text>
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
                  <Ionicons name="fitness" size={40} color="#FFFFFF" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <View style={styles.trainerBadge}>
                    <Ionicons name="star" size={14} color="#FFFFFF" />
                    <Text style={styles.trainerBadgeText}>
                      Certified Trainer
                    </Text>
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
                  <Ionicons name="people-outline" size={20} color="#6397C9" />
                  <Text style={styles.detailLabel}>Trainees:</Text>
                  <Text style={styles.detailValue}>
                    {profile.assignedTrainees} assigned
                  </Text>
                </View>
              </View>
            </View>

            {renderQRCode()}

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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6397C9",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#FFFFFF",
    marginLeft: 5,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  trainerBadge: {
    backgroundColor: "#FF8C00",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  trainerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#CCCCCC",
    width: 80,
    marginLeft: 10,
  },
  detailValue: {
    color: "#FFFFFF",
    flex: 1,
  },
  qrSection: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  qrDescription: {
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  passwordButton: {
    backgroundColor: "#333333",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  passwordButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#6397C9",
    marginBottom: 5,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
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
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default TrainerProfileScreen;
