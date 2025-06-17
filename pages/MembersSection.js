"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { format, differenceInDays, isBefore, parseISO } from "date-fns";
import Slider from "@react-native-community/slider";

const MembersSection = ({ onExpiringMembersUpdate }) => {
  // State variables - all hooks must be at the top level
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [months, setMonths] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserType, setCurrentUserType] = useState(null);
  const [sliderValue, setSliderValue] = useState(1); // Default to 1 month
  const [sliderMaxValue] = useState(12); // Max 12 months

  // Success modal state variables - important to keep these at the top level
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  // Member form state
  const [newMember, setNewMember] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    contactNum: "",
    membershipDuration: "1",
    userType: "member",
  });

  // Add new state for notifications
  const [membershipNotifications, setMembershipNotifications] = useState([]);
  const [expiringMembers, setExpiringMembers] = useState([]);

  // New states for trainer/staff modal
  const [showAddTrainerOrStaffModal, setShowAddTrainerOrStaffModal] =
    useState(false);
  const [newTrainerOrStaff, setNewTrainerOrStaff] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    contactNum: "",
    userType: "trainer", // Default to trainer
  });

  // Replace with your actual API base URL
  const API_BASE_URL = "http://localhost/lifthub";

  useEffect(() => {
    const loadUserType = async () => {
      try {
        const userType = await AsyncStorage.getItem("userType");
        setCurrentUserType(userType || "staff"); // Default to staff if not set
      } catch (error) {
        console.error("Failed to load user type:", error);
        setCurrentUserType("staff"); // Fallback to staff on error
      }
    };

    loadUserType();
    fetchMembers();
  }, []);

  // Generate QR code value
  const generateQRValue = (userId, userName) => {
    return `LIFTHUB_${userId}_${userName}_${Date.now()}`;
  };

  // Check expiring memberships
  const checkExpiringMemberships = (members) => {
    const today = Math.floor(Date.now() / 1000); // Current Unix timestamp
    const thirtyDaysFromNow = today + 30 * 24 * 60 * 60; // 30 days in seconds

    return members.filter((member) => {
      if (member.membership > 0) {
        // If membership contains timestamp
        return (
          member.membership <= thirtyDaysFromNow && member.membership >= today
        );
      }
      return false;
    });
  };

  // Fetch members from the server
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/get_members.php`);
      const data = await response.json();

      if (data.success) {
        // Process each member's membership date
        const processedMembers = data.members.map((member) => {
          // Console log to debug what fields are coming from the API
          console.log("Raw member data:", member);

          return {
            ...member,
            // Normalize username field (handle both username and userName)
            username: member.username || member.userName || "",
            // Ensure membership is properly formatted for JS Date object
            membershipFormatted: member.membership
              ? formatMembership(member.membership)
              : "No membership",
          };
        });

        console.log("Processed first member:", processedMembers[0]);
        setMembers(processedMembers);

        // Identify members with expiring memberships (within 7 days)
        const expiring = processedMembers.filter((member) => {
          if (member.userType !== "member" || !member.membership) return false;

          // Parse the membership date string to a Date object
          const membershipDate = parseISO(member.membership);
          const today = new Date();

          // Calculate days difference
          const daysDifference = differenceInDays(membershipDate, today);

          // Return true if expiring within 7 days or already expired
          return daysDifference <= 7;
        });

        setExpiringMembers(expiring);

        // Only check expiring memberships for members
        // Add this line right after setExpiringMembers(expiring):
        if (onExpiringMembersUpdate) {
          onExpiringMembersUpdate(expiring);
        }
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

  // Helper function to format membership date for display
  const formatMembership = (dateString) => {
    if (!dateString) return "No membership";

    try {
      // Parse the ISO date string
      const date = parseISO(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("Date parsing error:", error);
      return "Invalid date";
    }
  };

  // Helper function to determine membership status
  const getMembershipStatus = (dateString) => {
    if (!dateString) return { status: "none", label: "No Membership" };

    try {
      const membershipDate = parseISO(dateString);
      const today = new Date();

      if (isBefore(membershipDate, today)) {
        return { status: "expired", label: "Expired" };
      }

      const daysDifference = differenceInDays(membershipDate, today);

      if (daysDifference <= 7) {
        return { status: "expiring", label: "Expiring Soon" };
      }

      return { status: "active", label: "Active" };
    } catch (error) {
      console.error("Status calculation error:", error);
      return { status: "error", label: "Error" };
    }
  };

  // Handle member click to show actions
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberActions(true);
  };

  // Handle add membership
  const handleAddMembership = async (months) => {
    try {
      // Get the current staff's user ID
      const staffID = await AsyncStorage.getItem("userId");

      const response = await fetch(`${API_BASE_URL}/add_membership.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: selectedMember.id || selectedMember.userID,
          months: months,
          currentMembership: selectedMember.membership || 0,
          staffID: staffID, // Add the staff ID for logging
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMembers(
          members.map((m) =>
            m.id === selectedMember.id
              ? { ...m, membership: result.newMembership }
              : m
          )
        );

        // Show success modal instead of Alert
        setSuccessTitle("Membership Added");
        setSuccessMessage(
          `${months} month${
            months !== 1 ? "s" : ""
          } membership added successfully for ${
            selectedMember.name || selectedMember.fullName
          }`
        );
        setShowSuccessModal(true);

        setShowAddMembership(false);
        setSliderValue(1); // Reset slider

        // Refresh the members list to update expiring members
        fetchMembers();
      } else {
        throw new Error(result.message || "Failed to add membership");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!selectedMember) {
      Alert.alert("Error", "No member selected");
      return;
    }

    if (!staffPassword) {
      Alert.alert("Error", "Please enter your staff password for confirmation");
      return;
    }

    setLoading(true);
    try {
      // Get the current staff's user ID from AsyncStorage
      const staffID = await AsyncStorage.getItem("userId");

      // Debug the selected member object
      console.log("Selected member:", selectedMember);

      // Use the correct ID property (it could be id or userID)
      const memberId = selectedMember.id || selectedMember.userID;

      console.log("Sending reset request with data:", {
        userID: memberId,
        staffPassword: staffPassword,
        staffID: staffID, // Add the staff's user ID
      });

      const response = await fetch(`${API_BASE_URL}/reset_password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: memberId,
          staffPassword: staffPassword,
          staffID: staffID, // Add the staff's user ID
        }),
      });

      const result = await response.json();
      console.log("Reset password response:", result);

      if (result.success) {
        // Show success modal
        setSuccessTitle("Password Reset");
        setResetPasswordValue("JT123");
        setSuccessMessage(
          `Password reset successfully for ${
            selectedMember.name || selectedMember.fullName
          }.\nNew password: JT123`
        );
        setShowSuccessModal(true);

        setShowResetPassword(false);
        setStaffPassword("");
      } else {
        Alert.alert("Error", result.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Update the handleAddMember function to better handle user types

  const handleAddMember = async () => {
    const requiredFields = [
      "username",
      "fullName",
      "email",
      "password",
      "contactNum",
    ];
    const missingFields = requiredFields.filter((field) => !newMember[field]);

    if (missingFields.length > 0) {
      setError(`Please complete these fields: ${missingFields.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      // Get the current staff's user ID
      const staffID = await AsyncStorage.getItem("userId");

      const memberData = {
        ...newMember,
        userType: newMember.userType || "member",
        membershipDuration: newMember.membershipDuration || "1",
      };

      // Debug logs
      console.log("SELECTED USER TYPE:", memberData.userType);

      // Use a separate endpoint for each user type OR make the type very explicit in the URL
      const endpointUrl = `${API_BASE_URL}/add_member.php?explicit_user_type=${memberData.userType}&force_type=true`;

      console.log("Using endpoint:", endpointUrl);

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...memberData,
          staffID: staffID, // Add the staff ID for logging
        }),
      });

      // FIX: Store response text first before parsing
      const responseText = await response.text();
      console.log("Server response:", responseText);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      try {
        // FIX: Parse the stored response text
        const data = JSON.parse(responseText);

        if (data.success) {
          // Create the new member object
          const newMemberObj = {
            id: data.userId,
            username: memberData.username || "",
            // Ensure name is properly set - maybe server returns fullName instead of name
            name: memberData.fullName || memberData.name || "",
            fullName: memberData.fullName, // Add this line to map fullName to name
            email: memberData.email || "",
            contactNum: memberData.contactNum || "",
            membership: data.membership || null,
            membershipFormatted: data.membership
              ? formatMembership(data.membership)
              : "No membership",
          };

          setMembers([...members, newMemberObj]);
          setFilteredMembers([...filteredMembers, newMemberObj]);
          setShowAddMember(false);
          setNewMember({
            username: "",
            fullName: "",
            email: "",
            password: "",
            contactNum: "",
            membershipDuration: "1", // Default to 1 month
            userType: "member", // Reset userType to default
          });

          // Show success modal instead of Alert
          setSuccessTitle("Success");
          setSuccessMessage(
            `${
              newMember.userType.charAt(0).toUpperCase() +
              newMember.userType.slice(1)
            } added successfully`
          );
          setShowSuccessModal(true);

          // If this was a newly added member with expiring membership (within 7 days)
          // also update the expiring members list
          const expiryDate = new Date(data.membership);
          const today = new Date();
          const daysDifference = differenceInDays(expiryDate, today);

          if (daysDifference <= 7) {
            // Add to expiring members if onExpiringMembersUpdate is provided
            if (onExpiringMembersUpdate) {
              const updatedExpiringMembers = [...expiringMembers, newMemberObj];
              onExpiringMembersUpdate(updatedExpiringMembers);
            }
          }
        } else {
          throw new Error(data.message || "Failed to add member");
        }
      } catch (parseError) {
        console.error("Response parsing error:", parseError);
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("Add member error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a similar fix for the add trainer/staff function
  const handleAddTrainerOrStaff = async () => {
    const requiredFields = [
      "username",
      "fullName",
      "email",
      "password",
      "contactNum",
    ];
    const missingFields = requiredFields.filter(
      (field) => !newTrainerOrStaff[field]
    );

    if (missingFields.length > 0) {
      setError(`Please complete these fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setLoading(true);

      // Similar approach as handleAddMember
      const staffData = {
        ...newTrainerOrStaff,
        fullName: newTrainerOrStaff.fullName,
        // No membership duration for staff/trainers
      };

      console.log("Sending staff data: ", staffData);

      const response = await fetch(`${API_BASE_URL}/add_trainer_or_staff.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffData),
      });

      // FIX: Store response text first before parsing
      const responseText = await response.text();
      console.log("Server response:", responseText);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      try {
        // FIX: Parse the stored response text
        const data = JSON.parse(responseText);

        if (data.success) {
          // Reset the form
          setShowAddTrainerOrStaffModal(false);
          setNewTrainerOrStaff({
            username: "",
            fullName: "",
            email: "",
            password: "",
            contactNum: "",
            userType: "trainer",
          });

          Alert.alert("Success", `${staffData.userType} added successfully`);
        } else {
          throw new Error(
            data.message || `Failed to add ${staffData.userType}`
          );
        }
      } catch (parseError) {
        console.error("Response parsing error:", parseError);
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("Add trainer/staff error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }; // Fixed: Added missing closing brace for handleAddTrainerOrStaff function

  useEffect(() => {
    // Simply fetch members when the component mounts
    fetchMembers();

    // Set up a refresh interval if needed (optional)
    const refreshInterval = setInterval(() => {
      fetchMembers();
    }, 300000); // Refresh every 5 minutes

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []); // Fixed: Moved this useEffect outside of the handleAddTrainerOrStaff function

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery]);

  const filterMembers = () => {
    if (!searchQuery) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(
      (member) =>
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.contactNum?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "No membership";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  // Fix the getUserTypeBadgeColor function to handle undefined values
  const getUserTypeBadgeColor = (userType) => {
    // Add null check before calling toLowerCase()
    if (!userType) return "#6397C9"; // Default color for undefined/null user types

    switch (userType.toLowerCase()) {
      case "admin":
        return "#FF4500"; // Admin color
      case "trainer":
        return "#FFA500"; // Trainer color
      case "staff":
        return "#7B68EE"; // Staff color
      case "member":
      default:
        return "#6397C9"; // Member color (default)
    }
  };

  const renderMember = () => {
    return filteredMembers
      .filter((member) => member.userType !== "admin")
      .map((member, index) => {
        // Calculate days until expiration for members
        let statusColor = "#888"; // Default gray color
        let membershipStatus = "No membership";
        let membershipColor = "#888";

        if (member.userType === "member") {
          if (member.membership) {
            try {
              const expiryDate = new Date(member.membership);
              const today = new Date();

              if (isNaN(expiryDate.getTime())) {
                console.error("Invalid date format:", member.membership);
              } else {
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                  statusColor = "#FF0000";
                  membershipStatus = `Expired: ${formatExpiryDate(
                    member.membership
                  )}`;
                  membershipColor = "#FF4444";
                } else if (diffDays <= 7) {
                  statusColor = "#FFD700";
                  membershipStatus = `Expires soon: ${formatExpiryDate(
                    member.membership
                  )}`;
                  membershipColor = "#FFD700";
                } else {
                  statusColor = "#00FF00";
                  membershipStatus = `Expires: ${formatExpiryDate(
                    member.membership
                  )}`;
                  membershipColor = "#4CAF50";
                }
              }
            } catch (e) {
              console.error("Error parsing membership date:", e);
            }
          } else {
            membershipStatus = "No membership";
            membershipColor = "#888";
          }
        }

        return (
          <TouchableOpacity
            key={member.userID}
            style={styles.modernMemberCard}
            onPress={() => handleMemberClick(member)}
          >
            {/* Member Card Header */}
            <View style={styles.memberCardHeader}>
              <View style={styles.memberAvatarContainer}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={28} color="#6397C9" />
                </View>
                <View style={styles.memberBasicInfo}>
                  <View style={styles.nameWithStatusContainer}>
                    {member.userType === "member" && (
                      <View
                        style={[
                          styles.statusCircle,
                          { backgroundColor: statusColor },
                        ]}
                      />
                    )}
                    <Text style={styles.memberName}>
                      {(
                        member.fullName ||
                        member.name ||
                        member.username ||
                        "UNNAMED MEMBER"
                      ).toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.userTypeBadge,
                      {
                        backgroundColor: getUserTypeBadgeColor(member.userType),
                      },
                    ]}
                  >
                    <Text style={styles.userTypeText}>
                      {(member.userType || "member").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Member Details Grid */}
            <View style={styles.memberDetailsGrid}>
              {member.username && (
                <View style={[styles.detailCard, styles.usernameCard]}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="at-circle" size={16} color="#6397C9" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Username</Text>
                    <Text style={[styles.detailValue, styles.usernameValue]}>
                      {member.username}
                    </Text>
                  </View>
                </View>
              )}
              {member.email && (
                <View style={styles.detailCard}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="mail" size={16} color="#6397C9" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{member.email}</Text>
                  </View>
                </View>
              )}
              {member.contactNum && (
                <View style={styles.detailCard}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="call" size={16} color="#6397C9" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.detailValue}>{member.contactNum}</Text>
                  </View>
                </View>
              )}
              {member.userType === "member" && (
                <View style={[styles.detailCard, styles.membershipCard]}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="time" size={16} color={membershipColor} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Membership</Text>
                    <Text
                      style={[styles.detailValue, { color: membershipColor }]}
                    >
                      {membershipStatus}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      });
  };

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

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.fixedHeaderContainer}>
        {/* Fixed Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#6397C9"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search members..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.modernAddButton}
              onPress={() => setShowAddMember(true)}
            >
              <View style={styles.addButtonContent}>
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Member</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Scrollable Members List */}
      <View style={styles.scrollableContent}>
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="people-outline" size={64} color="#333" />
            </View>
            <Text style={styles.emptyStateTitle}>No Members Found</Text>{" "}
            {/* Fixed */}
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search criteria
            </Text>{" "}
            {/* Fixed */}
          </View>
        ) : (
          <View style={styles.membersListContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#6397C9" />
            ) : filteredMembers.length > 0 ? (
              renderMember()
            ) : (
              <Text style={styles.noMembersText}>No members found</Text>
            )}
          </View>
        )}
      </View>

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
                {selectedMember?.userType}
              </Text>
            </View>

            {/* Only show Add Membership button for members */}
            {selectedMember?.userType === "member" && (
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
            )}
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

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValueText}>
                {sliderValue} month{sliderValue !== 1 ? "s" : ""}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={sliderMaxValue}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
                minimumTrackTintColor="#6397C9"
                maximumTrackTintColor="#333"
                thumbTintColor="#6397C9"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1</Text>
                <Text style={styles.sliderLabel}>12</Text>
              </View>
            </View>

            {/* Fix missing key prop in membership options */}
            <View style={styles.membershipOptions}>
              {[1, 3, 6, 12].map((months) => (
                <TouchableOpacity
                  key={`membership-option-${months}`} // Add unique key prop here
                  style={styles.membershipOption}
                  onPress={() => handleAddMembership(months)}
                >
                  <Text style={styles.membershipMonths}>{months}</Text>
                  <Text style={styles.membershipLabel}>
                    {months === 1 ? "Month" : "Months"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleAddMembership(sliderValue)}
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
                placeholder={
                  currentUserType === "admin"
                    ? "Enter admin password"
                    : "Enter your staff password"
                }
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
                      value={newMember.fullName}
                      onChangeText={(text) =>
                        setNewMember({ ...newMember, fullName: text })
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
                        (newMember.userType === "member" ||
                          !newMember.userType) &&
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
                          newMember.userType === "member" || !newMember.userType
                            ? "#FFFFFF"
                            : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.roleTextWide,
                          (newMember.userType === "member" ||
                            !newMember.userType) &&
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
                        currentUserType !== "admin" && styles.disabledOption,
                      ]}
                      onPress={() => {
                        if (currentUserType === "admin") {
                          setNewMember({ ...newMember, userType: "staff" });
                        }
                      }}
                      disabled={currentUserType !== "admin"}
                    >
                      <Ionicons
                        name="briefcase"
                        size={24}
                        color={
                          newMember.userType === "staff"
                            ? "#FFFFFF"
                            : currentUserType !== "admin"
                            ? "#333"
                            : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.roleTextWide,
                          newMember.userType === "staff" &&
                            styles.roleTextSelected,
                          currentUserType !== "admin" && styles.disabledText,
                        ]}
                      >
                        Staff
                        {currentUserType !== "admin" && (
                          <Text style={styles.disabledHint}> (Admin only)</Text>
                        )}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleOptionWide,
                        newMember.userType === "trainer" &&
                          styles.roleOptionSelected,
                      ]}
                      onPress={() => {
                        console.log(
                          "Before setting: Current userType =",
                          newMember.userType
                        );
                        setNewMember((prevState) => {
                          const updated = { ...prevState, userType: "trainer" };
                          console.log(
                            "Setting userType to trainer:",
                            updated.userType
                          );
                          return updated;
                        });
                      }}
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
                    <Text style={styles.submitButtonText}>
                      Add{" "}
                      {newMember.userType
                        ? newMember.userType.charAt(0).toUpperCase() +
                          newMember.userType.slice(1)
                        : "Member"}
                    </Text>
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successModalHeader}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={styles.successModalTitle}>{successTitle}</Text>
            </View>
            <Text style={styles.successModalMessage}>{successMessage}</Text>
            {resetPasswordValue && (
              <View style={styles.passwordContainer}>
                <Text style={styles.newPasswordLabel}>New Password:</Text>
                <Text style={styles.newPasswordValue}>
                  {resetPasswordValue}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.successCloseButton}
              onPress={() => {
                setShowSuccessModal(false);
                setResetPasswordValue(""); // Clear password after closing
              }}
            >
              <Text style={styles.successCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#0A0A0A",
    position: "relative",
  },
  fixedHeaderContainer: {
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#0A0A0A",
  },
  scrollableContent: {
    flex: 1,
    overflowY: "auto",
    padding: 15,
    paddingBottom: 20,
  },
  // Fixed Header Styles
  headerSection: {
    backgroundColor: "#1A1A1A",
    paddingTop: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    elevation: 3,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 12,
    height: 50,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "400",
  },
  modernAddButton: {
    backgroundColor: "#6397C9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modernMemberCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
  },
  memberCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  memberAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(99,151,201,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberBasicInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameWithStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // FIXED USERNAME VISIBILITY
  usernameText: {
    color: "#6397C9",
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  userTypeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  memberDetailsGrid: {
    marginTop: 8,
  },
  detailCard: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#222222",
    borderRadius: 8,
    marginBottom: 8,
  },
  usernameCard: {
    backgroundColor: "#1E3A5F",
    borderLeftWidth: 3,
    borderLeftColor: "#6397C9",
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    color: "#999999",
    fontSize: 12,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  // FIXED USERNAME VALUE VISIBILITY
  usernameValue: {
    color: "#6397C9",
    fontWeight: "600",
    fontSize: 14,
  },
  membershipCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#6397C9",
  },
  membersListContainer: {
    flex: 1,
    padding: 16,
  },
  noMembersText: {
    color: "#CCCCCC",
    textAlign: "center",
    marginTop: 20,
  },
  // Notification Styles
  notificationContainer: {
    backgroundColor: "#2A1810",
    margin: 20,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  notificationTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  // Modal and other existing styles remain the same
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
  roleOptionSelected: {
    backgroundColor: "#6397C9",
  },
  sliderContainer: {
    width: "100%",
    marginBottom: 30,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderValueText: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  sliderLabel: {
    marginBottom: 4,
    color: "#888",
    fontSize: 14,
  },
  successModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  successModalMessage: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  successCloseButton: {
    backgroundColor: "#6397C9",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
  },
  successCloseButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  passwordContainer: {
    backgroundColor: "#2A2A2A",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  newPasswordLabel: {
    color: "#CCCCCC",
    marginBottom: 5,
  },
  newPasswordValue: {
    color: "#4CAF50",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default MembersSection;
