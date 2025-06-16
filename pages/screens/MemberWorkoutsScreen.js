"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MemberWorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedWorkoutIds, setSavedWorkoutIds] = useState([]);
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

  // Fetch workouts and saved workouts when userId becomes available
  useEffect(() => {
    if (userId) {
      fetchWorkouts();
      fetchSavedWorkouts();
    }
  }, [userId]);

  // Filter workouts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkouts(workouts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = workouts.filter(
        (workout) =>
          workout.workoutName.toLowerCase().includes(query) ||
          workout.workoutDesc.toLowerCase().includes(query) ||
          workout.creatorName.toLowerCase().includes(query) ||
          workout.workoutLevel.toLowerCase().includes(query)
      );
      setFilteredWorkouts(filtered);
    }
  }, [searchQuery, workouts]);

  const fetchWorkouts = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all available workouts (not created by or assigned to this user)
      const response = await fetch(
        `${API_BASE_URL}/get_available_workouts.php?userID=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch workouts");
      }

      // Format workouts for display
      const formattedWorkouts = data.workouts.map((workout) => ({
        id: workout.workoutID,
        name: workout.workoutName,
        description: workout.workoutDesc,
        difficulty: workout.workoutLevel,
        trainerName: workout.creatorName,
        exercises: workout.exercises || [],
      }));

      setWorkouts(formattedWorkouts);
      setFilteredWorkouts(formattedWorkouts);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);

      // Use mock data for development/testing
      if (__DEV__) {
        console.log("Using mock data since API failed");
        const mockWorkouts = [
          {
            id: "1",
            name: "Full Body Workout",
            description: "Complete full body workout routine",
            difficulty: "Intermediate",
            trainerName: "John Smith",
            exercises: [
              { name: "Push-ups", sets: 3, reps: 15 },
              { name: "Squats", sets: 3, reps: 20 },
              { name: "Plank", sets: 3, duration: "30 seconds" },
            ],
          },
          {
            id: "2",
            name: "Upper Body Focus",
            description: "Chest, back, and arms",
            difficulty: "Advanced",
            trainerName: "Sarah Davis",
            exercises: [
              { name: "Bench Press", sets: 4, reps: 10 },
              { name: "Pull-ups", sets: 3, reps: 8 },
              { name: "Bicep Curls", sets: 3, reps: 12 },
            ],
          },
        ];

        setWorkouts(mockWorkouts);
        setFilteredWorkouts(mockWorkouts);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSavedWorkouts = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/get_member_workouts.php?memberID=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.savedWorkouts) {
        // Extract IDs of saved workouts
        const savedIds = data.savedWorkouts.map((workout) => workout.id);
        setSavedWorkoutIds(savedIds);
      }
    } catch (err) {
      console.error("Failed to fetch saved workouts:", err);
      // Silent failure - we'll just show no saved workouts
      setSavedWorkoutIds([]);
    }
  };

  const handleSaveWorkout = async (workoutId) => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setLoading(true);

      const isSaved = savedWorkoutIds.includes(workoutId);
      const action = isSaved ? "unsave" : "save";

      const response = await fetch(`${API_BASE_URL}/save_workout.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutID: workoutId,
          memberID: userId,
          action: action,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save workout");
      }

      // Update local state
      if (action === "save") {
        setSavedWorkoutIds([...savedWorkoutIds, workoutId]);
      } else {
        setSavedWorkoutIds(savedWorkoutIds.filter((id) => id !== workoutId));
      }

      Alert.alert(
        "Success",
        action === "save"
          ? "Workout saved successfully"
          : "Workout removed from saved"
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderWorkoutItem = ({ item }) => {
    const isSaved = savedWorkoutIds.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.workoutItem}
        onPress={() => setSelectedWorkout(item)}
      >
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text style={styles.trainerName}>by {item.trainerName}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSaveWorkout(item.id)}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isSaved ? "#6397C9" : "#666"}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.workoutDescription}>{item.description}</Text>

        <View style={styles.workoutMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{item.difficulty}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="fitness-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              {item.exercises.length} exercises
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && workouts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  if (error && workouts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWorkouts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <View style={styles.searchContainer}>
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
        </View>
      </View>

      {filteredWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#333" />
          <Text style={styles.emptyStateText}>No workouts found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.workoutList}
          onRefresh={fetchWorkouts}
          refreshing={refreshing}
        />
      )}

      {/* Workout Details Modal */}
      <Modal
        visible={!!selectedWorkout}
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
                Trainer: {selectedWorkout?.trainerName}
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
            </View>

            <Text style={styles.exercisesTitle}>Exercises:</Text>

            {selectedWorkout?.exercises?.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>
                  {exercise.exerciseName || exercise.name}
                </Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} sets × {exercise.reps} reps
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.saveWorkoutButton}
              onPress={() => {
                handleSaveWorkout(selectedWorkout.id);
                setSelectedWorkout(null);
              }}
            >
              <Ionicons
                name={
                  savedWorkoutIds.includes(selectedWorkout?.id)
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={20}
                color="#FFFFFF"
                style={styles.saveWorkoutIcon}
              />
              <Text style={styles.saveWorkoutText}>
                {savedWorkoutIds.includes(selectedWorkout?.id)
                  ? "Remove from My Workouts"
                  : "Save to My Workouts"}
              </Text>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
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
  saveButton: {
    padding: 5,
  },
  workoutDescription: {
    color: "#CCCCCC",
    marginBottom: 10,
  },
  workoutMeta: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  metaText: {
    color: "#666",
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
    marginBottom: 20,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
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
  saveWorkoutButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  saveWorkoutIcon: {
    marginRight: 10,
  },
  saveWorkoutText: {
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
});

export default MemberWorkoutsScreen;
