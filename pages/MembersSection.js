"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MembersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [months, setMonths] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newMember, setNewMember] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    contactNum: "",
    userType: "member",
  });

  // Replace with your actual API base URL
  const API_BASE_URL = "http://localhost/lifthub";

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/get_members.php`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // First get the raw text
      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text); // Then parse it

      if (data.success) {
        setMembers(
          data.members.map((member) => ({
            id: member.userID,
            name: member.fullName,
            contact: member.contactNum,
            membership: member.userType,
          }))
        );
      } else {
        throw new Error(data.error || "Failed to fetch members");
      }
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    // Validate required fields
    if (!newMember.username || !newMember.fullname || !newMember.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      // Include current user's type in the request
      const response = await fetch(`${API_BASE_URL}/add_member.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newMember,
          currentUserType: "staff", // This should come from your auth context
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new member to local state
        setMembers([
          ...members,
          {
            id: result.userID,
            name: newMember.fullname,
            contact: newMember.contactNum,
            membership: newMember.userType,
          },
        ]);

        Alert.alert("Success", "Member added successfully");
        setShowAddMember(false);
        setNewMember({
          username: "",
          fullname: "",
          email: "",
          password: "",
          contactNum: "",
          userType: "member", // Reset to default
        });
      } else {
        throw new Error(result.message || "Failed to add member");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!staffPassword) {
      Alert.alert("Error", "Please enter your staff password");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reset_password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: selectedMember.id,
          staffPassword: staffPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Success", "Password reset successfully");
        setShowResetPassword(false);
        setStaffPassword("");
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleAddMember = async () => {
    // Validate required fields
    if (!newMember.username || !newMember.fullname || !newMember.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/add_member.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMember),
      });

      const result = await response.json();

      if (result.success) {
        // Add new member to local state
        setMembers([
          ...members,
          {
            id: result.userID,
            name: newMember.fullname,
            contact: newMember.contactNum,
            membership: newMember.userType,
          },
        ]);

        Alert.alert("Success", "Member added successfully");
        setShowAddMember(false);
        setNewMember({
          username: "",
          fullname: "",
          email: "",
          password: "",
          contactNum: "",
          userType: "member", // Reset to default
        });
      } else {
        throw new Error(result.message || "Failed to add member");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.contact.includes(searchQuery)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddMember(true)}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.memberList}>
        {filteredMembers.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberItem}
            onPress={() => handleMemberClick(member)}
          >
            <View style={styles.memberHeader}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color="#6397C9"
              />
              <Text style={styles.memberName}>{member.name}</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={16} color="#666" />
                <Text style={styles.memberDetails}>{member.contact}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="fitness-outline" size={16} color="#666" />
                <Text style={styles.memberDetails}>{member.membership}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredMembers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={styles.emptyStateText}>No members found</Text>
          </View>
        )}
      </ScrollView>

      {/* Member Actions Modal */}
      <Modal
        visible={showMemberActions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Actions</Text>
              <TouchableOpacity onPress={() => setShowMemberActions(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.memberActionInfo}>
              <Text style={styles.memberActionName}>
                {selectedMember?.name}
              </Text>
              <Text style={styles.memberActionType}>
                {selectedMember?.membership}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowMemberActions(false);
                setShowAddMembership(true);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#FFFFFF"
                style={styles.actionIcon}
              />
              <Text style={styles.actionButtonText}>Add Membership</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowMemberActions(false);
                setShowResetPassword(true);
              }}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color="#FFFFFF"
                style={styles.actionIcon}
              />
              <Text style={styles.actionButtonText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMemberActions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Membership Modal */}
      <Modal
        visible={showAddMembership}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMembership(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Membership</Text>
              <TouchableOpacity onPress={() => setShowAddMembership(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Extend membership for {selectedMember?.name}
            </Text>

            <View style={styles.inputWithIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter number of months"
                placeholderTextColor="#666"
                value={months}
                onChangeText={setMonths}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMembership}
            >
              <Text style={styles.submitButtonText}>Add Membership</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMembership(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowResetPassword(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Reset password for {selectedMember?.name}
            </Text>

            <View style={styles.inputWithIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter staff password"
                placeholderTextColor="#666"
                value={staffPassword}
                onChangeText={setStaffPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.submitButtonText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowResetPassword(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMember(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.addMemberModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Member</Text>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formColumn}>
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>
                    Account Information
                  </Text>

                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Username *"
                      placeholderTextColor="#666"
                      value={newMember.username}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, username: text })
                      }
                    />
                  </View>

                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password *"
                      placeholderTextColor="#666"
                      value={newMember.password}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, password: text })
                      }
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>
                    Personal Information
                  </Text>

                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="person-circle-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name *"
                      placeholderTextColor="#666"
                      value={newMember.fullname}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, fullname: text })
                      }
                    />
                  </View>

                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#666"
                      value={newMember.email}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, email: text })
                      }
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Number"
                      placeholderTextColor="#666"
                      value={newMember.contactNum}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, contactNum: text })
                      }
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formColumn}>
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Role</Text>

                  <View style={styles.roleSelectionVertical}>
                    <TouchableOpacity
                      style={[
                        styles.roleOptionWide,
                        newMember.userType === "member" &&
                          styles.roleOptionSelected,
                      ]}
                      onPress={() =>
                        setNewMember({ ...newMember, userType: "member" })
                      }
                    >
                      <Ionicons
                        name="person"
                        size={24}
                        color={
                          newMember.userType === "member" ? "#FFFFFF" : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.roleTextWide,
                          newMember.userType === "member" &&
                            styles.roleTextSelected,
                        ]}
                      >
                        Member
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleOptionWide,
                        newMember.userType === "staff" &&
                          styles.roleOptionSelected,
                        // Disable if current user is staff
                        currentUserType === "staff" && styles.disabledOption,
                      ]}
                      onPress={() => {
                        if (currentUserType !== "staff") {
                          setNewMember({ ...newMember, userType: "staff" });
                        }
                      }}
                      disabled={currentUserType === "staff"}
                    >
                      <Ionicons
                        name="briefcase"
                        size={24}
                        color={
                          newMember.userType === "staff"
                            ? "#FFFFFF"
                            : currentUserType === "staff"
                            ? "#333"
                            : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.roleTextWide,
                          newMember.userType === "staff" &&
                            styles.roleTextSelected,
                          currentUserType === "staff" && styles.disabledText,
                        ]}
                      >
                        Staff
                        {currentUserType === "staff" && (
                          <Text style={styles.disabledHint}>
                            {" "}
                            (Not allowed)
                          </Text>
                        )}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleOptionWide,
                        newMember.userType === "trainer" &&
                          styles.roleOptionSelected,
                      ]}
                      onPress={() =>
                        setNewMember({ ...newMember, userType: "trainer" })
                      }
                    >
                      <Ionicons
                        name="fitness"
                        size={24}
                        color={
                          newMember.userType === "trainer" ? "#FFFFFF" : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.roleTextWide,
                          newMember.userType === "trainer" &&
                            styles.roleTextSelected,
                        ]}
                      >
                        Trainer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddMember}
                  >
                    <Text style={styles.submitButtonText}>Add Member</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddMember(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  memberList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  memberItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  memberInfo: {
    marginLeft: 34,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  memberDetails: {
    color: "#666",
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
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
  addMemberModalContent: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 800,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#6397C9",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 15,
  },
  memberActionInfo: {
    backgroundColor: "#222222",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  memberActionName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  memberActionType: {
    color: "#6397C9",
    fontSize: 14,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  actionIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    padding: 12,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
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
  formContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formColumn: {
    width: "48%",
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    color: "#6397C9",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  roleSelectionVertical: {
    width: "100%",
  },
  roleOptionWide: {
    backgroundColor: "#222222",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  roleTextWide: {
    color: "#666",
    marginLeft: 10,
    fontSize: 14,
  },
  roleTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formActions: {
    marginTop: 10,
  },
  disabledOption: {
    backgroundColor: "#1A1A1A",
    opacity: 0.5,
  },
  disabledText: {
    color: "#333",
  },
  disabledHint: {
    color: "#FF4444",
    fontSize: 12,
  },
});

export default MembersSection;
