"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView, // Added ScrollView import
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TraineesScreen = () => {
  const [trainees, setTrainees] = useState([]);
  const [userID, setUserId] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newTraineeName, setNewTraineeName] = useState("");
  const [addingTrainee, setAddingTrainee] = useState(false);
  const [trainerID, setTrainerID] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showWorkoutFeedbackModal, setShowWorkoutFeedbackModal] =
    useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Update the API base URL setup
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub", // For Android emulator (points to host machine's localhost)
    ios: "http://localhost/lifthub", // For iOS simulator
    default: "http://localhost/lifthub", // For web
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          console.log("Found userId:", storedUserId);
          setUserId(storedUserId);
          setTrainerID(storedUserId); // Set trainer ID to fetch trainees
        } else {
          console.log("No userId found, redirecting to login");
          // navigation.replace("Login")
        }
      } catch (error) {
        console.error("Auth check error:", error);
        Alert.alert("Error", "Authentication failed");
        // navigation.replace("Login")
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (trainerID) {
      fetchTrainees(trainerID);
    }
  }, [trainerID]);

  // Update the search filter to match property names correctly
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTrainees(trainees);
    } else {
      const filtered = trainees.filter(
        (trainee) =>
          trainee.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trainee.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trainee.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTrainees(filtered);
    }
  }, [searchQuery, trainees]);

  const fetchTrainees = async (id) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/get_trainees_with_progress.php?trainerID=${id}`;
      const response = await fetch(url);

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("API Response Data:", data); // Debug log

      const processedTrainees = Array.isArray(data)
        ? data.map((trainee) => {
            const workouts = trainee.workouts || [];
            return {
              id: trainee.id,
              username: trainee.username,
              fullName: trainee.name, // Note: API uses 'name' for fullName
              email: trainee.email,
              contact: trainee.phone, // API uses 'phone' instead of 'contact'
              progress: trainee.progress || 0,
              totalWorkouts: workouts.length,
              completedWorkouts: workouts.filter((w) => w.completed).length,
              workoutsWithFeedback: workouts.filter((w) => w.hasFeedback)
                .length,
              workouts: workouts.map((w) => ({
                name: w.name,
                completed: w.completed,
                hasFeedback: w.hasFeedback,
                feedback: w.feedback || "",
              })),
            };
          })
        : [];

      setTrainees(processedTrainees);
      setFilteredTrainees(processedTrainees);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);

      // For testing only: Use mock data when API fails in development
      if (__DEV__) {
        console.log("Using mock data since API failed");
        const mockData = [
          {
            id: "1",
            name: "John Smith",
            email: "john@example.com",
            progress: 75,
            totalWorkouts: 2,
            completedWorkouts: 1,
            workoutsWithFeedback: 1,
            workouts: [
              {
                name: "Full Body",
                completed: true,
                hasFeedback: true,
                feedback: "Great workout!",
              },
              { name: "Upper Body", completed: false },
            ],
          },
          {
            id: "2",
            name: "Sarah Johnson",
            email: "sarah@example.com",
            progress: 40,
            totalWorkouts: 1,
            completedWorkouts: 1,
            workoutsWithFeedback: 0,
            workouts: [
              { name: "Leg Day", completed: true, hasFeedback: false },
            ],
          },
        ];
        setTrainees(mockData);
        setFilteredTrainees(mockData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddTrainee = async () => {
    if (!newTraineeName.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setAddingTrainee(true);

    try {
      // CRITICAL: First explicitly check if the user already has a trainer assigned
      console.log(`Checking if ${newTraineeName} already has a trainer...`);

      const checkUrl = `${API_BASE_URL}/check_trainee_status.php`;
      console.log(`Making request to: ${checkUrl}`);

      const checkResponse = await fetch(checkUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userName: newTraineeName.trim(),
        }),
      });

      // Check if the response is valid
      if (!checkResponse.ok) {
        console.error(`Check trainee response not OK: ${checkResponse.status}`);
        throw new Error(`Server error: ${checkResponse.status}`);
      }

      // Get the response as text first for debugging
      const checkResponseText = await checkResponse.text();
      console.log("Check trainee raw response:", checkResponseText);

      // Try to parse the response
      let statusData;
      try {
        statusData = JSON.parse(checkResponseText);
      } catch (parseError) {
        console.error("Error parsing check response:", parseError);
        throw new Error("Invalid server response when checking trainee status");
      }

      console.log("Check trainee parsed response:", statusData);

      // Handle user not found
      if (statusData.error === "user_not_found") {
        Alert.alert(
          "User Not Found",
          `No member with username "${newTraineeName}" exists.`,
          [{ text: "OK" }]
        );
        setAddingTrainee(false);
        return;
      }

      // Handle trainee already having a trainer
      if (statusData.hasTrainer) {
        Alert.alert(
          "Already Assigned",
          `${newTraineeName} is already assigned to trainer ${
            statusData.trainerName || "Unknown"
          }.`,
          [{ text: "OK" }]
        );
        setAddingTrainee(false);
        return;
      }

      // If we get here, the user exists and doesn't have a trainer - proceed with adding
      console.log("User check passed, proceeding to add trainee");

      // Proceed with adding the trainee
      const url = `${API_BASE_URL}/add_trainee.php`;
      console.log(`Adding trainee at: ${url}`);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainerID: trainerID,
          userName: newTraineeName.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Debug: log the response text before parsing
      const responseText = await response.text();
      console.log("Add trainee API raw response:", responseText);

      // Try to parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);

        // Check if the response contains HTML (likely PHP error)
        if (
          responseText.includes("<!DOCTYPE html>") ||
          responseText.includes("<html>")
        ) {
          throw new Error(
            "Server returned HTML instead of JSON. There might be a PHP error."
          );
        } else {
          throw new Error(
            `Invalid JSON response: ${responseText.substring(0, 100)}...`
          );
        }
      }

      if (data.error) {
        // Handle specific error cases
        if (
          data.error.includes("already assigned") ||
          data.error.includes("already has a trainer")
        ) {
          Alert.alert(
            "Already Assigned",
            "This member is already assigned to another trainer."
          );
        } else {
          Alert.alert("Error", data.error);
        }
      } else if (data.success) {
        Alert.alert("Success", "Trainee added successfully");
        setModalVisible(false);
        setNewTraineeName("");
        fetchTrainees(trainerID);
      } else {
        Alert.alert("Error", "An unknown error occurred");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Alert.alert("Error", "Request timed out. Please try again.");
      } else {
        console.error("Error adding trainee:", err);
        Alert.alert(
          "Error",
          err.message || "Failed to add trainee. Check your network connection."
        );
      }
    } finally {
      setAddingTrainee(false);
    }
  };

  const viewWorkoutFeedback = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutFeedbackModal(true);
  };

  const renderTraineeItem = ({ item }) => {
    // Ensure we have all required fields
    const traineeData = {
      id: item.id,
      username: item.username,
      fullName: item.fullName || item.name,
      email: item.email,
      contact: item.contact || item.phone,
      progress: item.progress || 0,
      totalWorkouts: item.totalWorkouts || 0,
      completedWorkouts: item.completedWorkouts || 0,
      workoutsWithFeedback: item.workoutsWithFeedback || 0,
      workouts: item.workouts || [],
    };

    return (
      <TouchableOpacity
        style={styles.traineeItem}
        onPress={() => {
          console.log("Selected trainee data:", traineeData);
          setSelectedTrainee(traineeData);
        }}
      >
        <View style={styles.traineeHeader}>
          <View style={styles.traineeAvatar}>
            <Text style={styles.traineeInitials}>
              {traineeData.fullName
                ? traineeData.fullName.charAt(0)
                : traineeData.username.charAt(0)}
            </Text>
          </View>
          <View style={styles.traineeInfo}>
            <Text style={styles.traineeName}>
              {traineeData.fullName || traineeData.username}
            </Text>
            {traineeData.email && (
              <Text style={styles.traineeEmail}>{traineeData.email}</Text>
            )}
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {traineeData.progress}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${traineeData.progress}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.statText}>
              {traineeData.completedWorkouts} completed
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#FFA500" />
            <Text style={styles.statText}>
              {traineeData.totalWorkouts - traineeData.completedWorkouts}{" "}
              pending
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color="#6397C9" />
            <Text style={styles.statText}>
              {traineeData.workoutsWithFeedback} feedback
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrainees(trainerID);
  };

  useEffect(() => {
    let timeoutId;
    if (loading || refreshing) {
      timeoutId = setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, 10000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, refreshing]);

  if (loading && !refreshing && trainees.length === 0 && !error) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading trainees...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTrainees(trainerID)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trainees</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trainees"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {trainees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>No trainees found</Text>
          <Text style={styles.emptySubText}>
            Add your first trainee by clicking the button above
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons
              name="person-add"
              size={20}
              color="#FFFFFF"
              style={styles.emptyAddIcon}
            />
            <Text style={styles.emptyAddText}>Add Trainee</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTrainees}
          renderItem={renderTraineeItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No trainees match your search
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Add Trainee Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Trainee</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructions}>
              Enter the username of the member you want to add as your trainee
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#6397C9"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Member username"
                placeholderTextColor="#666"
                value={newTraineeName}
                onChangeText={setNewTraineeName}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.addTraineeButton,
                addingTrainee && styles.disabledButton,
              ]}
              onPress={handleAddTrainee}
              disabled={addingTrainee}
            >
              {addingTrainee ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={18}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.addTraineeButtonText}>Add Trainee</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Trainee Details Modal */}
      <Modal visible={!!selectedTrainee} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedTrainee(null)}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedTrainee?.fullName ||
                  selectedTrainee?.username ||
                  "Trainee"}
              </Text>
            </View>

            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Profile</Text>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Username:</Text>
                  <Text style={styles.profileValue}>
                    {selectedTrainee?.username || "N/A"}
                  </Text>
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Full Name:</Text>
                  <Text style={styles.profileValue}>
                    {selectedTrainee?.fullName || "N/A"}
                  </Text>
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Email:</Text>
                  <Text style={styles.profileValue}>
                    {selectedTrainee?.email || "N/A"}
                  </Text>
                </View>

                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Phone:</Text>
                  <Text style={styles.profileValue}>
                    {selectedTrainee?.contact || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Progress Section */}
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Progress</Text>
                <Text style={styles.modalProgress}>
                  Overall: {selectedTrainee?.progress || 0}%
                </Text>
                <View style={styles.modalProgressBar}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      { width: `${selectedTrainee?.progress || 0}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Workouts Section */}
              <View style={styles.assignedWorkoutsSection}>
                <Text style={styles.sectionTitle}>Assigned Workouts</Text>

                {selectedTrainee?.workouts?.length > 0 ? (
                  selectedTrainee.workouts.map((workout, index) => (
                    <View key={index} style={styles.workoutItem}>
                      <View style={styles.workoutItemHeader}>
                        <Text style={styles.workoutName}>{workout.name}</Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            workout.completed
                              ? styles.completedStatus
                              : styles.pendingStatus,
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {workout.completed ? "Completed" : "Pending"}
                          </Text>
                        </View>
                      </View>

                      {workout.hasFeedback && (
                        <TouchableOpacity
                          style={styles.feedbackButton}
                          onPress={() => viewWorkoutFeedback(workout)}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.feedbackButtonText}>
                            View Feedback
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noWorkoutsText}>
                    No workouts assigned yet
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Workout Feedback Modal */}
      <Modal
        visible={showWorkoutFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWorkoutFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Feedback</Text>
              <TouchableOpacity
                onPress={() => setShowWorkoutFeedbackModal(false)}
              >
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.feedbackWorkoutInfo}>
              <Text style={styles.feedbackWorkoutName}>
                {selectedWorkout?.name}
              </Text>
              <View
                style={[
                  styles.statusIndicator,
                  selectedWorkout?.completed
                    ? styles.completedStatus
                    : styles.pendingStatus,
                ]}
              >
                <Text style={styles.statusText}>
                  {selectedWorkout?.completed ? "Completed" : "Pending"}
                </Text>
              </View>
            </View>

            <View style={styles.feedbackContent}>
              <Text style={styles.feedbackContentTitle}>Trainee Feedback:</Text>
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>
                  {selectedWorkout?.feedback}
                </Text>
              </View>
            </View>
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: "#1A1A1A",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 5,
  },
  listContainer: {
    padding: 15,
  },
  traineeItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  traineeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  traineeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  traineeInitials: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  traineeEmail: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    color: "#6397C9",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333333",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 3,
  },
  workoutStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "#CCCCCC",
    fontSize: 14,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  emptyAddButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyAddIcon: {
    marginRight: 8,
  },
  emptyAddText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    color: "#AAAAAA",
    fontSize: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 16,
    marginVertical: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  modalInstructions: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
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
  addTraineeButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addTraineeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  detailsModalContent: {
    backgroundColor: "#1A1A1A",
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 20,
  },
  profileSection: {
    marginBottom: 25,
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 15,
  },
  progressSection: {
    marginBottom: 25,
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    color: "#6397C9",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  profileLabel: {
    color: "#AAAAAA",
    width: 100,
    fontSize: 14,
  },
  profileValue: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 14,
  },
  modalProgress: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  modalProgressBar: {
    height: 10,
    backgroundColor: "#333333",
    borderRadius: 5,
    overflow: "hidden",
  },
  modalProgressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 5,
  },
  assignedWorkoutsSection: {
    marginBottom: 25,
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 15,
  },
  workoutItem: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  workoutItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  completedStatus: {
    backgroundColor: "#4CAF50",
  },
  pendingStatus: {
    backgroundColor: "#FFA500",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6397C9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  feedbackButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "500",
  },
  noWorkoutsText: {
    color: "#AAAAAA",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  feedbackModalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  feedbackWorkoutInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 10,
  },
  feedbackWorkoutName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  feedbackContent: {
    marginBottom: 15,
  },
  feedbackContentTitle: {
    color: "#6397C9",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  feedbackBox: {
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 10,
  },
  feedbackText: {
    color: "#FFFFFF",
    lineHeight: 22,
  },
});

export default TraineesScreen;
