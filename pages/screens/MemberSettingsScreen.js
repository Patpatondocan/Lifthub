"use client";

import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "../../utils/storage";
import { logout } from "../../utils/auth";
import { AuthContext } from "../../context/AuthContext";
import { Picker } from "@react-native-picker/picker";

const MemberSettingsScreen = ({ setIsLoggedIn }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [feedbackType, setFeedbackType] = useState("general"); // 'general' or 'trainer'
  const [assignedTrainers, setAssignedTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [rating, setRating] = useState(0);

  // Access auth context for logout
  const { setIsLoggedIn: contextSetIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);
      } catch (error) {
        console.error("Failed to get user ID:", error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (
      typeof setIsLoggedIn !== "function" &&
      typeof contextSetIsLoggedIn !== "function"
    ) {
      console.error(
        "No valid setIsLoggedIn function available in MemberSettingsScreen"
      );
    }
  }, [setIsLoggedIn, contextSetIsLoggedIn]);

  useEffect(() => {
    // Fetch assigned trainers for the member
    const fetchAssignedTrainers = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `http://10.0.2.2/lifthub/get_trainers_with_assignments.php?userID=${userId}`
        );
        const data = await response.json();
        if (data.success && data.trainers) {
          setAssignedTrainers(data.trainers);
        }
      } catch (e) {
        // Ignore error, fallback to general feedback
      }
    };
    if (feedbackType === "trainer") fetchAssignedTrainers();
  }, [feedbackType, userId]);

  // Only allow trainer feedback if member has a trainer
  const hasTrainer = assignedTrainers.length > 0;
  const trainer = hasTrainer ? assignedTrainers[0] : null;

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !userId) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }
    if (feedbackType === "trainer") {
      if (!selectedTrainer) {
        Alert.alert("Error", "Please select a trainer");
        return;
      }
      if (!rating) {
        Alert.alert("Error", "Please provide a rating");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const now = new Date();
      const feedbackDate = now.toISOString();
      const body =
        feedbackType === "trainer"
          ? {
              userID: userId,
              feedback: feedbackText,
              trainerID: trainer.userID,
              rating,
              feedbackDate, // Add date for trainer feedback
            }
          : { userID: userId, feedback: feedbackText };
      const response = await fetch(
        "http://10.0.2.2/lifthub/submit_feedback.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();
      if (result.success) {
        setShowFeedbackModal(false);
        setFeedbackText("");
        setSelectedTrainer(null);
        setRating(0);
        setFeedbackType("general");
        Alert.alert("Success", "Your feedback has been submitted. Thank you!");
      } else {
        throw new Error(result.message || "Failed to submit feedback");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Member logout initiated");

      // Attempt logout with various available callbacks
      if (typeof setIsLoggedIn === "function") {
        console.log("Using prop setIsLoggedIn function");
        await logout(setIsLoggedIn);
      } else if (typeof contextSetIsLoggedIn === "function") {
        console.log("Using context setIsLoggedIn function");
        await logout(contextSetIsLoggedIn);
      } else {
        // Force direct logout and reset app state
        await logout(null);
        console.log("No callback available, using direct logout");

        // For mobile platforms, force a navigation to login screen
        if (Platform.OS !== "web") {
          // Clear all storage
          await AsyncStorage.clear();

          // Use force reload approach for mobile
          Alert.alert("Logged Out", "You have been logged out successfully", [
            {
              text: "OK",
              onPress: () => {
                // Reset app state to trigger login screen
                AsyncStorage.setItem("isAuthenticated", "false").then(() => {
                  // This will force many apps to show the login screen again
                  if (Platform.OS === "web") {
                    window.location.reload();
                  }
                });
              },
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred during logout. Please restart the app."
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setShowFeedbackModal(true)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color="#FFFFFF"
            style={styles.feedbackIcon}
          />
          <Text style={styles.feedbackButtonText}>Send General Feedback</Text>
        </TouchableOpacity>
        <Text style={styles.feedbackNote}>
          Use this to provide general feedback about the app or gym facilities.
          For workout-specific feedback, please use the feedback option in your
          assigned workouts.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity
          style={styles.aboutItem}
          onPress={() => setShowTermsModal(true)}
        >
          <Text style={styles.aboutLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#6397C9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.aboutItem}
          onPress={() => setShowPrivacyModal(true)}
        >
          <Text style={styles.aboutLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#6397C9" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#FFFFFF"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              We value your feedback! Please let us know how we can improve your
              experience.
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <TouchableOpacity
                style={{ marginRight: 10 }}
                onPress={() => setFeedbackType("general")}
              >
                <Text
                  style={{
                    color: feedbackType === "general" ? "#6397C9" : "#fff",
                    fontWeight: "bold",
                  }}
                >
                  General
                </Text>
              </TouchableOpacity>
              {hasTrainer && (
                <TouchableOpacity onPress={() => setFeedbackType("trainer")}>
                  <Text
                    style={{
                      color: feedbackType === "trainer" ? "#6397C9" : "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    Trainer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {feedbackType === "trainer" && hasTrainer && (
              <>
                <Text style={{ color: "#fff", marginBottom: 5 }}>
                  Trainer: {trainer.fullName}
                </Text>
                <Text style={{ color: "#fff", marginBottom: 5 }}>Rating</Text>
                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={28}
                        color={star <= rating ? "#FFD700" : "#666"}
                        style={{ marginHorizontal: 2 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <TextInput
              style={styles.feedbackInput}
              placeholder="Enter your feedback here..."
              placeholderTextColor="#666"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={5}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmitFeedback}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms of Service</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.termsContainer}>
              <Text style={styles.termsSubheading}>1. Acceptance of Terms</Text>
              <Text style={styles.termsText}>
                By accessing or using LiftHub, you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do
                not use our service.
              </Text>

              <Text style={styles.termsSubheading}>
                2. Membership and Account
              </Text>
              <Text style={styles.termsText}>
                You are responsible for maintaining the confidentiality of your
                account information and password. You agree to accept
                responsibility for all activities that occur under your account.
              </Text>

              <Text style={styles.termsSubheading}>3. Code of Conduct</Text>
              <Text style={styles.termsText}>
                Users must respect fellow gym members and staff. Harassment,
                discrimination, or intimidation will not be tolerated. Proper
                gym etiquette must be observed at all times.
              </Text>

              <Text style={styles.termsSubheading}>4. Termination</Text>
              <Text style={styles.termsText}>
                We reserve the right to terminate or suspend your account at our
                sole discretion, without notice, for conduct that we believe
                violates these Terms of Service or is harmful to other users,
                us, or third parties, or for any other reason.
              </Text>

              <Text style={styles.termsSubheading}>
                5. Liability Limitations
              </Text>
              <Text style={styles.termsText}>
                LiftHub is not responsible for any injuries or accidents that
                may occur during workouts. Users are advised to consult with a
                physician before beginning any exercise program.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.termsContainer}>
              <Text style={styles.termsSubheading}>
                1. Information We Collect
              </Text>
              <Text style={styles.termsText}>
                We collect personal information such as name, email, contact
                details, and physical fitness data to provide our services. We
                also collect usage data to improve our platform.
              </Text>

              <Text style={styles.termsSubheading}>
                2. How We Use Information
              </Text>
              <Text style={styles.termsText}>
                Your information is used to manage your account, provide
                personalized workout services, communicate with you, and improve
                our platform. We do not sell your personal information to third
                parties.
              </Text>

              <Text style={styles.termsSubheading}>3. Data Security</Text>
              <Text style={styles.termsText}>
                We implement appropriate security measures to protect your
                personal information from unauthorized access, alteration, or
                disclosure.
              </Text>

              <Text style={styles.termsSubheading}>
                4. Cookies and Tracking
              </Text>
              <Text style={styles.termsText}>
                Our website uses cookies to enhance your browsing experience,
                analyze site traffic, and personalize content. You can control
                cookie preferences through your browser settings.
              </Text>

              <Text style={styles.termsSubheading}>5. Your Rights</Text>
              <Text style={styles.termsText}>
                You have the right to access, correct, or delete your personal
                information. Contact us if you wish to exercise these rights or
                have any privacy concerns.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    padding: 15,
    backgroundColor: "#1A1A1A",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 20,
  },
  sectionTitle: {
    color: "#6397C9",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  feedbackButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  feedbackIcon: {
    marginRight: 10,
  },
  feedbackButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  feedbackNote: {
    color: "#CCCCCC",
    fontSize: 14,
    marginTop: 10,
    fontStyle: "italic",
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  aboutLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#FF4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalDescription: {
    color: "#CCCCCC",
    marginBottom: 15,
  },
  feedbackInput: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: "#6397C9",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  termsContainer: {
    maxHeight: 400,
  },
  termsSubheading: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  termsText: {
    color: "#CCCCCC",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});

export default MemberSettingsScreen;
