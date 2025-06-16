"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { __DEV__ } from "react-native";

const WorkoutsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // API base URL based on platform
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    ios: "http://localhost/lifthub",
    default: "http://localhost/lifthub",
  });

  // Fetch all workouts on component mount
  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Filter workouts when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkouts(workouts);
    } else {
      const filtered = workouts.filter(
        (workout) =>
          workout.workoutName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          workout.workoutDesc
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          workout.workoutLevel
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredWorkouts(filtered);
    }
  }, [searchQuery, workouts]);

  // Fetch workouts from API
  const fetchWorkouts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/get_workouts_admin.php`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.workouts) {
        setWorkouts(data.workouts);
        setFilteredWorkouts(data.workouts);
      } else {
        throw new Error(data.message || "Failed to fetch workouts");
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
      Alert.alert("Error", "Failed to load workouts. Please try again later.");

      // Mock data for development
      if (__DEV__) {
        const mockWorkouts = [
          {
            workoutID: "1",
            workoutName: "Full Body Strength",
            workoutDesc:
              "Complete full body workout focusing on strength building",
            workoutLevel: "intermediate",
          },
          {
            workoutID: "2",
            workoutName: "Cardio Blast",
            workoutDesc: "High intensity cardio workout",
            workoutLevel: "beginner",
          },
          {
            workoutID: "3",
            workoutName: "Upper Body Power",
            workoutDesc: "Focus on upper body strength and power",
            workoutLevel: "advanced",
          },
          {
            workoutID: "4",
            workoutName: "Leg Day Crusher",
            workoutDesc: "Intense lower body workout",
            workoutLevel: "intermediate",
          },
          {
            workoutID: "5",
            workoutName: "Core Strength",
            workoutDesc: "Focus on core stability and strength",
            workoutLevel: "beginner",
          },
          {
            workoutID: "6",
            workoutName: "HIIT Training",
            workoutDesc: "High intensity interval training",
            workoutLevel: "advanced",
          },
          {
            workoutID: "7",
            workoutName: "Flexibility Flow",
            workoutDesc: "Stretching and mobility workout",
            workoutLevel: "beginner",
          },
        ];
        setWorkouts(mockWorkouts);
        setFilteredWorkouts(mockWorkouts);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle workout selection
  const handleWorkoutSelect = async (workout) => {
    setSelectedWorkout(workout);
    setIsLoadingExercises(true);

    try {
      // Using our new endpoint to get workout details with exercises
      const response = await fetch(
        `${API_BASE_URL}/get_workout_details.php?workoutID=${workout.workoutID}`
      );

      const data = await response.json();

      if (data.success) {
        // Update the selected workout with any additional details and user information
        setSelectedWorkout((prev) => ({
          ...prev,
          ...data.workout,
          creator: data.creator,
          assigner: data.assigner || null,
          assignee: data.assignee || null,
        }));

        // Set the exercises
        setWorkoutExercises(data.exercises);
      } else {
        throw new Error(data.message || "Failed to fetch workout details");
      }
    } catch (error) {
      console.error("Error fetching workout details:", error);
      Alert.alert(
        "Error",
        "Failed to load workout details. Please try again later."
      );
      setWorkoutExercises([]);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  // Format difficulty level for display
  const formatDifficulty = (level) => {
    return level?.charAt(0).toUpperCase() + level?.slice(1).toLowerCase();
  };

  // Render workout item for FlatList
  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.workoutItem,
        selectedWorkout?.workoutID === item.workoutID &&
          styles.workoutItemActive,
      ]}
      onPress={() => handleWorkoutSelect(item)}
    >
      <Text style={styles.workoutName}>{item.workoutName}</Text>
      <View style={styles.workoutMetaContainer}>
        <Text style={styles.workoutLevel}>
          {formatDifficulty(item.workoutLevel)}
        </Text>
        {item.workoutProgress && (
          <Text style={styles.workoutProgress}>{item.workoutProgress}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render exercise item
  const renderExerciseItem = ({ item, index }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>{item.name || item.exerciseName}</Text>
      <Text style={styles.exerciseDetails}>
        {item.sets} sets × {item.reps} reps
        {item.duration && ` (${item.duration})`}
      </Text>
    </View>
  );

  // Render the workout details panel with additional user information
  const renderWorkoutDetails = () => {
    if (!selectedWorkout) return null;

    return (
      <ScrollView
        style={styles.detailsScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.detailsTitle}>{selectedWorkout.workoutName}</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsSubtitle}>Description</Text>
          <Text style={styles.detailsText}>{selectedWorkout.workoutDesc}</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsSubtitle}>Difficulty</Text>
          <Text style={styles.detailsText}>
            {formatDifficulty(selectedWorkout.workoutLevel)}
          </Text>
        </View>

        {/* Creator Information */}
        {selectedWorkout.creator && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSubtitle}>Creator</Text>
            <View style={styles.userInfoContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#6397C9"
                style={styles.userInfoIcon}
              />
              <View style={styles.userInfoContent}>
                <Text style={styles.userName}>
                  {selectedWorkout.creator.fullName}
                </Text>
                <Text style={styles.userType}>
                  {selectedWorkout.creator.userType}
                </Text>
                {selectedWorkout.creator.email && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="mail-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.creator.email}
                  </Text>
                )}
                {selectedWorkout.creator.contact && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="call-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.creator.contact}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Assigned By Information */}
        {selectedWorkout.assigner && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSubtitle}>Assigned By</Text>
            <View style={styles.userInfoContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#FF9800"
                style={styles.userInfoIcon}
              />
              <View style={styles.userInfoContent}>
                <Text style={styles.userName}>
                  {selectedWorkout.assigner.fullName}
                </Text>
                <Text style={styles.userType}>Trainer</Text>
                {selectedWorkout.assigner.email && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="mail-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.assigner.email}
                  </Text>
                )}
                {selectedWorkout.assigner.contact && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="call-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.assigner.contact}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Assigned To Information */}
        {selectedWorkout.assignee && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSubtitle}>Assigned To</Text>
            <View style={styles.userInfoContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#4CAF50"
                style={styles.userInfoIcon}
              />
              <View style={styles.userInfoContent}>
                <Text style={styles.userName}>
                  {selectedWorkout.assignee.fullName}
                </Text>
                <Text style={styles.userType}>Member</Text>
                {selectedWorkout.assignee.email && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="mail-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.assignee.email}
                  </Text>
                )}
                {selectedWorkout.assignee.contact && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="call-outline" size={16} color="#666" />{" "}
                    {selectedWorkout.assignee.contact}
                  </Text>
                )}
                {selectedWorkout.assignee.membership && (
                  <Text style={styles.contactInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />{" "}
                    Membership until: {selectedWorkout.assignee.membership}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Status Information */}
        {selectedWorkout.workoutProgress && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSubtitle}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                getStatusStyle(selectedWorkout.workoutProgress),
              ]}
            >
              <Ionicons
                name={getStatusIcon(selectedWorkout.workoutProgress)}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {selectedWorkout.workoutProgress}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsSubtitle}>
            Exercises ({workoutExercises.length})
          </Text>
          {workoutExercises.length > 0 ? (
            <FlatList
              data={workoutExercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={styles.exerciseSeparator} />
              )}
            />
          ) : (
            <Text style={styles.noExercisesText}>
              No exercises found for this workout
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  // Helper function to get status badge style based on workout progress
  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return styles.completedStatus;
      case "In Progress":
        return styles.inProgressStatus;
      case "Assigned":
        return styles.assignedStatus;
      default:
        return styles.defaultStatus;
    }
  };

  // Helper function to get status icon based on workout progress
  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return "checkmark-circle-outline";
      case "In Progress":
        return "time-outline";
      case "Assigned":
        return "alert-circle-outline";
      default:
        return "information-circle-outline";
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header with Search */}
      <View style={styles.headerContainer}>
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
              placeholder="Search workouts"
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
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Workouts List */}
        <View style={styles.workoutsListContainer}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6397C9" />
              <Text style={styles.loadingText}>Loading workouts...</Text>
            </View>
          ) : (
            <View style={styles.workoutsListWrapper}>
              <FlatList
                data={filteredWorkouts}
                renderItem={renderWorkoutItem}
                keyExtractor={(item) => item.workoutID.toString()}
                contentContainerStyle={styles.workoutsList}
                showsVerticalScrollIndicator={true}
                style={styles.workoutsScrollContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="barbell-outline" size={48} color="#333" />
                    <Text style={styles.noWorkoutsText}>
                      {searchQuery
                        ? "No workouts match your search"
                        : "No workouts found"}
                    </Text>
                  </View>
                }
              />
            </View>
          )}
        </View>

        {/* Workout Details */}
        <View style={styles.detailsPanel}>
          {selectedWorkout ? (
            isLoadingExercises ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6397C9" />
                <Text style={styles.loadingText}>
                  Loading workout details...
                </Text>
              </View>
            ) : (
              renderWorkoutDetails()
            )
          ) : (
            <View style={styles.noSelection}>
              <Ionicons name="barbell-outline" size={48} color="#6397C9" />
              <Text style={styles.noSelectionText}>
                Select a workout to view details
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  headerContainer: {
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 20,
  },
  workoutsListContainer: {
    flex: 1,
    marginRight: 20,
    maxWidth: 320,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  workoutsListWrapper: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 10,
    height: 400, // Fixed height to show about 5 workouts
  },
  workoutsScrollContainer: {
    flex: 1,
  },
  workoutsList: {
    paddingBottom: 10,
  },
  workoutItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  workoutItemActive: {
    backgroundColor: "#6397C9",
    borderColor: "#6397C9",
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  workoutMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutLevel: {
    color: "#CCCCCC",
    fontSize: 14,
    fontWeight: "500",
  },
  workoutProgress: {
    color: "#FFC107",
    fontSize: 14,
    fontWeight: "500",
  },
  detailsPanel: {
    flex: 2,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
  },
  detailsScrollContainer: {
    flex: 1,
  },
  detailsTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  detailsSubtitle: {
    color: "#6397C9",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailsText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseItem: {
    paddingVertical: 12,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDetails: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  userInfoIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  userInfoContent: {
    flex: 1,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userType: {
    color: "#6397C9",
    fontSize: 14,
    marginBottom: 6,
    fontStyle: "italic",
  },
  contactInfo: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  completedStatus: {
    backgroundColor: "#4CAF50",
  },
  inProgressStatus: {
    backgroundColor: "#FF9800",
  },
  assignedStatus: {
    backgroundColor: "#2196F3",
  },
  defaultStatus: {
    backgroundColor: "#757575",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  exerciseSeparator: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 8,
  },
  noSelection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSelectionText: {
    color: "#666",
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noWorkoutsText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
  },
  noExercisesText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
});

export default WorkoutsSection;
