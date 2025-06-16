import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyWorkoutsScreen = () => {
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [activeTab, setActiveTab] = useState("saved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [userId, setUserId] = useState(null);

  // API base URL based on platform
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    default: "http://localhost/lifthub",
  });

  // Load userId when component mounts
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) {
          setUserId(id);
        } else {
          console.error("No user ID found in storage");
          setError("Not logged in. Please log in again.");
        }
      } catch (err) {
        console.error("Failed to load user ID:", err);
        setError("Authentication error");
      }
    };

    loadUserId();
  }, []);

  // Fetch workouts when userId becomes available
  useEffect(() => {
    if (userId) {
      fetchWorkouts();
    }
  }, [userId]);

  // Update the fetchWorkouts function to call both APIs separately
  const fetchWorkouts = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch saved workouts
      const savedResponse = await fetch(
        `${API_BASE_URL}/get_saved_workouts.php?memberID=${userId}`
      );

      // Fetch assigned workouts
      const assignedResponse = await fetch(
        `${API_BASE_URL}/get_assigned_workouts.php?memberID=${userId}`
      );

      if (!savedResponse.ok || !assignedResponse.ok) {
        throw new Error(
          `HTTP error! Status: ${
            !savedResponse.ok ? savedResponse.status : assignedResponse.status
          }`
        );
      }

      const savedData = await savedResponse.json();
      const assignedData = await assignedResponse.json();

      console.log("Assigned workouts data:", assignedData); // Debug log to see what's coming from the server

      // Set state with data from both API calls
      if (savedData.success) {
        setSavedWorkouts(savedData.savedWorkouts || []);
      } else {
        console.error("Failed to fetch saved workouts:", savedData.error);
      }

      if (assignedData.success) {
        // Make sure feedbackContent is included for each workout that has feedback
        const workoutsWithFeedback = (assignedData.assignedWorkouts || []).map(
          (workout) => {
            // Log workouts with feedback to debug
            if (workout.hasFeedback) {
              console.log(
                `Workout ${workout.id} has feedback:`,
                workout.feedbackContent
              );
            }
            return workout;
          }
        );

        setAssignedWorkouts(workoutsWithFeedback);
      } else {
        console.error("Failed to fetch assigned workouts:", assignedData.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);

      // Use mock data for development/testing if needed
      if (__DEV__) {
        setSavedWorkouts([
          {
            id: "2",
            name: "Upper Body Focus",
            description: "Chest, back, and arms",
            difficulty: "Advanced",
            duration: "30 mins",
            trainerName: "Sarah Davis",
            exercises: [
              { name: "Bench Press", sets: 4, reps: 10 },
              { name: "Pull-ups", sets: 3, reps: 8 },
              { name: "Bicep Curls", sets: 3, reps: 12 },
            ],
            isSaved: true,
            isAssigned: false,
          },
          {
            id: "3",
            name: "Core Strength",
            description: "Focus on abdominal and lower back",
            difficulty: "Beginner",
            duration: "20 mins",
            trainerName: "Mike Johnson",
            exercises: [
              { name: "Crunches", sets: 3, reps: 20 },
              { name: "Russian Twists", sets: 3, reps: 15 },
              { name: "Leg Raises", sets: 3, reps: 12 },
            ],
            isSaved: true,
            isAssigned: false,
          },
        ]);

        setAssignedWorkouts([
          {
            id: "1",
            name: "Full Body Workout",
            description: "Complete full body workout routine",
            difficulty: "Intermediate",
            duration: "45 mins",
            trainerName: "John Smith",
            exercises: [
              { name: "Push-ups", sets: 3, reps: 15 },
              { name: "Squats", sets: 3, reps: 20 },
              { name: "Plank", sets: 3, reps: null, duration: "30 seconds" },
            ],
            isSaved: false,
            isAssigned: true,
            completed: false,
            workoutProgress: "Assigned",
            assignedDate: "2023-05-15",
            hasFeedback: false,
          },
          {
            id: "4",
            name: "Leg Day",
            description: "Lower body strength and endurance",
            difficulty: "Intermediate",
            duration: "40 mins",
            trainerName: "Sarah Davis",
            exercises: [
              { name: "Squats", sets: 4, reps: 15 },
              { name: "Lunges", sets: 3, reps: 12 },
              { name: "Calf Raises", sets: 3, reps: 20 },
            ],
            isSaved: false,
            isAssigned: true,
            completed: true,
            workoutProgress: "Completed",
            assignedDate: "2023-05-10",
            hasFeedback: true,
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveSaved = async (workoutId) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/save_workout.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutID: workoutId,
          memberID: userId,
          action: "unsave",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to remove workout");
      }

      // Update local state
      setSavedWorkouts(
        savedWorkouts.filter((workout) => workout.id !== workoutId)
      );
      setSelectedWorkout(null);
      Alert.alert(
        "Success",
        data.message || "Workout removed from saved workouts"
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkoutProgress = async (workoutId, newStatus) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);

      // If trying to set to Completed, show confirmation dialog
      if (newStatus === "Completed") {
        Alert.alert(
          "Complete Workout",
          "Are you sure you want to mark this workout as completed? You cannot undo this action.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setLoading(false),
            },
            {
              text: "Complete",
              onPress: async () => {
                await updateWorkoutStatusInDb(workoutId, newStatus);
              },
            },
          ]
        );
      } else {
        // For other status changes, proceed without confirmation
        await updateWorkoutStatusInDb(workoutId, newStatus);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  const updateWorkoutStatusInDb = async (workoutId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/update_workout_progress.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workoutID: workoutId,
            memberID: userId,
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update workout status");
      }

      // Update local state
      setAssignedWorkouts(
        assignedWorkouts.map((workout) =>
          workout.id === workoutId
            ? {
                ...workout,
                workoutProgress: newStatus,
                completed: newStatus === "Completed",
                inProgress: newStatus === "In Progress",
              }
            : workout
        )
      );

      const statusMessages = {
        "In Progress": "Workout started! Keep up the good work!",
        Completed: "Congratulations! Workout completed!",
      };

      Alert.alert("Success", statusMessages[newStatus] || data.message);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!userId || !selectedWorkout) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    if (!feedbackText.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/submit_feedback.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutID: selectedWorkout.id,
          userID: userId,
          feedback: feedbackText,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      // Update local state
      setAssignedWorkouts(
        assignedWorkouts.map((workout) =>
          workout.id === selectedWorkout.id
            ? { ...workout, hasFeedback: true }
            : workout
        )
      );

      setShowFeedbackModal(false);
      setFeedbackText("");
      setSelectedWorkout(null);
      Alert.alert("Success", "Feedback submitted successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update renderWorkoutItem to remove "by" text for saved workouts
  const renderWorkoutItem = ({ item }) => {
    const isAssignedTab = activeTab === "assigned";
    const isCompleted = item.workoutProgress === "Completed";
    const isInProgress = item.workoutProgress === "In Progress";

    return (
      <TouchableOpacity
        style={[
          styles.workoutItem,
          isAssignedTab && isCompleted && styles.completedWorkout,
          isAssignedTab && isInProgress && styles.inProgressWorkout,
        ]}
        onPress={() => setSelectedWorkout(item)}
      >
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text style={styles.trainerName}>
              {isAssignedTab ? `by ${item.trainerName}` : `${item.trainerName}`}
            </Text>
          </View>

          {isAssignedTab && (
            <View
              style={[
                styles.statusBadge,
                isCompleted
                  ? styles.completedBadge
                  : isInProgress
                  ? styles.inProgressBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text style={styles.statusText}>
                {isCompleted
                  ? "Completed"
                  : isInProgress
                  ? "In Progress"
                  : "Pending"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.workoutDescription}>{item.description}</Text>

        <View style={styles.workoutMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{item.difficulty}</Text>
          </View>

          {isAssignedTab && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>Assigned: {item.assignedDate}</Text>
            </View>
          )}

          {isAssignedTab && item.hasFeedback && (
            <View style={styles.metaItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#4CAF50" />
              <Text style={[styles.metaText, styles.feedbackGiven]}>
                Feedback given
              </Text>
            </View>
          )}
        </View>

        {isAssignedTab && isCompleted && !item.hasFeedback && (
          <TouchableOpacity
            style={styles.provideFeedbackButton}
            onPress={() => {
              setSelectedWorkout(item);
              setShowFeedbackModal(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
            <Text style={styles.provideFeedbackText}>Provide Feedback</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && savedWorkouts.length === 0 && assignedWorkouts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading your workouts...</Text>
      </View>
    );
  }

  if (error && savedWorkouts.length === 0 && assignedWorkouts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWorkouts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWorkouts =
    activeTab === "saved" ? savedWorkouts : assignedWorkouts;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Workouts</Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "saved" && styles.activeTab]}
            onPress={() => setActiveTab("saved")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "saved" && styles.activeTabText,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "assigned" && styles.activeTab]}
            onPress={() => setActiveTab("assigned")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "assigned" && styles.activeTabText,
              ]}
            >
              Assigned
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={
              activeTab === "saved" ? "bookmark-outline" : "barbell-outline"
            }
            size={48}
            color="#333"
          />
          <Text style={styles.emptyStateText}>
            {activeTab === "saved"
              ? "No saved workouts yet"
              : "No workouts assigned by your trainer"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.workoutList}
          onRefresh={fetchWorkouts}
          refreshing={refreshing}
        />
      )}

      {/* Workout Details Modal */}
      <Modal
        visible={!!selectedWorkout && !showFeedbackModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedWorkout(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedWorkout?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedWorkout(null)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalTrainer}>
              <Ionicons name="person-outline" size={16} color="#6397C9" />
              <Text style={styles.modalTrainerText}>
                {selectedWorkout?.isAssigned
                  ? `Trainer: ${selectedWorkout?.trainerName}`
                  : `${selectedWorkout?.trainerName}`}
              </Text>
            </View>

            <Text style={styles.modalDescription}>
              {selectedWorkout?.description}
            </Text>

            <View style={styles.modalMeta}>
              <View style={styles.modalMetaItem}>
                <Ionicons name="barbell-outline" size={16} color="#6397C9" />
                <Text style={styles.modalMetaText}>
                  {selectedWorkout?.difficulty}
                </Text>
              </View>

              {selectedWorkout?.isAssigned && (
                <View style={styles.modalMetaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#6397C9" />
                  <Text style={styles.modalMetaText}>
                    Assigned: {selectedWorkout?.assignedDate}
                  </Text>
                </View>
              )}
            </View>

            {/* Show feedback if it exists */}
            {selectedWorkout?.hasFeedback && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackSectionTitle}>Your Feedback:</Text>
                <View style={styles.feedbackContent}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color="#4CAF50"
                  />
                  <Text style={styles.feedbackContentText}>
                    {selectedWorkout?.feedbackContent || "Feedback submitted"}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.exercisesTitle}>
              Exercises:{" "}
              {selectedWorkout?.exercises
                ? selectedWorkout.exercises.length
                : 0}
            </Text>

            {selectedWorkout?.exercises?.length > 0 ? (
              <ScrollView
                style={styles.exercisesScrollView}
                contentContainerStyle={styles.exercisesScrollContent}
              >
                {selectedWorkout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>
                      {exercise.name ||
                        exercise.exerciseName ||
                        "Unknown exercise"}
                    </Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets || 0} sets × {exercise.reps || 0} reps
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.exerciseItem}>
                <Text style={styles.noExercisesText}>
                  No exercises found for this workout
                </Text>
              </View>
            )}

            {selectedWorkout?.isAssigned && !selectedWorkout?.completed && (
              <View style={styles.progressButtonsContainer}>
                {selectedWorkout?.workoutProgress !== "In Progress" && (
                  <TouchableOpacity
                    style={styles.startProgressButton}
                    onPress={() =>
                      handleUpdateWorkoutProgress(
                        selectedWorkout.id,
                        "In Progress"
                      )
                    }
                  >
                    <Ionicons name="play-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.progressButtonText}>
                      Start Progress
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedWorkout?.workoutProgress === "In Progress" && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() =>
                      handleUpdateWorkoutProgress(
                        selectedWorkout.id,
                        "Completed"
                      )
                    }
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.progressButtonText}>
                      Complete Workout
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {selectedWorkout?.isAssigned &&
              selectedWorkout?.completed &&
              !selectedWorkout?.hasFeedback && (
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={() => {
                    setShowFeedbackModal(true);
                  }}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color="#FFFFFF"
                    style={styles.feedbackIcon}
                  />
                  <Text style={styles.feedbackButtonText}>
                    Provide Feedback
                  </Text>
                </TouchableOpacity>
              )}

            {selectedWorkout?.isSaved && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveSaved(selectedWorkout.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.removeIcon}
                />
                <Text style={styles.removeButtonText}>Remove from Saved</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provide Feedback</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowFeedbackModal(false);
                  if (!selectedWorkout?.hasFeedback) {
                    setSelectedWorkout(null);
                  }
                }}
              >
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.feedbackPrompt}>
              How was your experience with the "{selectedWorkout?.name}"
              workout?
            </Text>

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
              style={styles.submitFeedbackButton}
              onPress={handleSubmitFeedback}
            >
              <Text style={styles.submitFeedbackText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 15,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#333333",
    borderRadius: 25,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#6397C9",
  },
  tabText: {
    color: "#CCCCCC",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  workoutList: {
    padding: 15,
  },
  workoutItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  completedWorkout: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },
  inProgressWorkout: {
    borderLeftWidth: 5,
    borderLeftColor: "#FFA500",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  trainerName: {
    color: "#6397C9",
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: "#4CAF50",
  },
  inProgressBadge: {
    backgroundColor: "#FFA500",
  },
  pendingBadge: {
    backgroundColor: "#666",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  workoutDescription: {
    color: "#CCCCCC",
    marginBottom: 10,
  },
  workoutMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  metaText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 5,
  },
  feedbackGiven: {
    color: "#4CAF50",
  },
  provideFeedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6397C9",
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  provideFeedbackText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
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
  modalTrainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTrainerText: {
    color: "#6397C9",
    marginLeft: 5,
  },
  modalDescription: {
    color: "#CCCCCC",
    marginBottom: 15,
  },
  modalMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 5,
  },
  modalMetaText: {
    color: "#CCCCCC",
    marginLeft: 5,
  },
  exercisesTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  exerciseItem: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  exerciseDetails: {
    color: "#CCCCCC",
  },
  progressButtonsContainer: {
    marginTop: 20,
    gap: 10,
  },
  startProgressButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  progressButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  feedbackButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  feedbackIcon: {
    marginRight: 10,
  },
  feedbackButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: "#FF4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  removeIcon: {
    marginRight: 10,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
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
  feedbackPrompt: {
    color: "#FFFFFF",
    fontSize: 16,
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
  submitFeedbackButton: {
    backgroundColor: "#6397C9",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitFeedbackText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  noExercisesText: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  feedbackSection: {
    backgroundColor: "#2C2C2C",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  feedbackSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  feedbackContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 5,
  },
  feedbackContentText: {
    color: "#CCCCCC",
    marginLeft: 5,
  },

  // Add styles for exercise scrollview
  exercisesScrollView: {
    maxHeight: 240, // This will show approximately 4 items
    marginBottom: 15,
  },
  exercisesScrollContent: {
    paddingRight: 5,
  },
});

export default MyWorkoutsScreen;
