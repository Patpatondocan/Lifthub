"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const WorkoutsScreen = ({ navigation }) => {
  // Initialize state
  const [userId, setUserId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    difficulty: "Beginner",
    exercises: [],
  });
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [selectedTrainees, setSelectedTrainees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef(null);
  const [trainees, setTrainees] = useState([]);
  const [activeTab, setActiveTab] = useState("main"); // New state to track active tab: 'main' or 'assigned'
  const [mainWorkouts, setMainWorkouts] = useState([]); // Original workout templates
  const [assignedWorkouts, setAssignedWorkouts] = useState([]); // Assigned workout copies

  // API base URL configuration
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    default: "http://localhost/lifthub",
  });

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        // Get the trainer ID from AsyncStorage
        const trainerId = await AsyncStorage.getItem("userId");

        if (!trainerId) {
          throw new Error("Trainer ID not found. Please login again.");
        }

        // Make sure to include the trainerID parameter in the URL
        const response = await fetch(
          `${API_BASE_URL}/get_trainees.php?trainerID=${trainerId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setTrainees(data.trainees || []);
        } else {
          throw new Error(data.error || "Failed to fetch trainees");
        }
      } catch (error) {
        console.error("Error fetching trainees:", error);
        Alert.alert("Error", error.message);
      }
    };

    if (userId) {
      fetchTrainees();
    }
  }, [userId]);

  // Get userId on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          console.log("Found userId:", storedUserId);
          setUserId(storedUserId);
        } else {
          console.log("No userId found, redirecting to login");
          navigation.replace("Login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        Alert.alert("Error", "Authentication failed");
        navigation.replace("Login");
      }
    };

    checkAuth();
  }, []);

  // Fetch workouts when userId is available
  useEffect(() => {
    if (userId) {
      fetchWorkouts();
    }
  }, [userId]);

  // Modify the fetchWorkouts function to separate workouts into categories
  const fetchWorkouts = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/get_workouts.php?creatorID=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Separate workouts into main and assigned categories
        const main = data.filter((workout) => !workout.assignedToID);
        const assigned = data.filter((workout) => workout.assignedToID);

        setMainWorkouts(main);
        setAssignedWorkouts(assigned);
        setWorkouts(data); // Keep the full list for compatibility

        // Set filtered workouts based on active tab
        if (activeTab === "main") {
          setFilteredWorkouts(main);
        } else {
          setFilteredWorkouts(assigned);
        }
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to update filtered workouts when tab changes
  useEffect(() => {
    if (activeTab === "main") {
      setFilteredWorkouts(mainWorkouts);
    } else {
      setFilteredWorkouts(assignedWorkouts);
    }
  }, [activeTab, mainWorkouts, assignedWorkouts]);

  // Modify search filter to respect the active tab
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, just show workouts from current tab
      setFilteredWorkouts(
        activeTab === "main" ? mainWorkouts : assignedWorkouts
      );
      return;
    }

    // Choose which array of workouts to filter based on the active tab
    const workoutsToFilter =
      activeTab === "main" ? mainWorkouts : assignedWorkouts;

    const filtered = workoutsToFilter.filter(
      (workout) =>
        workout.workoutName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        workout.workoutDesc
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        workout.workoutLevel?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredWorkouts(filtered);
  }, [searchQuery, activeTab, mainWorkouts, assignedWorkouts]);

  const handleAddWorkout = async () => {
    try {
      if (!userId) {
        throw new Error("User ID is missing");
      }

      // Validate inputs
      if (!newWorkout.name.trim()) {
        Alert.alert("Error", "Workout name cannot be empty");
        return;
      }

      if (newWorkout.exercises.length === 0) {
        Alert.alert("Error", "Please add at least one exercise");
        return;
      }

      // Validate each exercise
      for (const exercise of newWorkout.exercises) {
        if (!exercise.name.trim()) {
          Alert.alert("Error", "Exercise name cannot be empty");
          return;
        }
        if (!exercise.sets || exercise.sets <= 0) {
          Alert.alert("Error", "Sets must be greater than 0");
          return;
        }
        if (!exercise.reps || exercise.reps <= 0) {
          Alert.alert("Error", "Reps must be greater than 0");
          return;
        }
      }

      setLoading(true);

      // Ensure creatorID is included in the request
      const workoutData = {
        ...newWorkout,
        creatorID: userId,
      };

      const response = await fetch(`${API_BASE_URL}/add_workout.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state with the new workout
      const newWorkoutWithId = {
        ...workoutData,
        id: data.id, // Assuming your PHP returns the new workout's ID
      };

      setWorkouts((prevWorkouts) => [...prevWorkouts, newWorkoutWithId]);
      setFilteredWorkouts((prevFiltered) => [
        ...prevFiltered,
        newWorkoutWithId,
      ]);

      // Reset form and close modal
      setNewWorkout({
        name: "",
        description: "",
        difficulty: "Beginner",
        exercises: [],
        creatorID: userId,
      });
      setShowAddModal(false);
      Alert.alert("Success", "Workout added successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkout = async () => {
    try {
      if (!userId) {
        throw new Error("User ID is missing");
      }

      if (!editingWorkout.name.trim()) {
        Alert.alert("Error", "Workout name cannot be empty");
        return;
      }

      if (editingWorkout.exercises.length === 0) {
        Alert.alert("Error", "Please add at least one exercise");
        return;
      }

      // Validate each exercise
      for (const exercise of editingWorkout.exercises) {
        if (!exercise.name.trim()) {
          Alert.alert("Error", "Exercise name cannot be empty");
          return;
        }
        if (!exercise.sets || exercise.sets <= 0) {
          Alert.alert("Error", "Sets must be greater than 0");
          return;
        }
        if (!exercise.reps || exercise.reps <= 0) {
          Alert.alert("Error", "Reps must be greater than 0");
          return;
        }
      }

      setLoading(true);

      console.log("Starting workout update process...");

      // STEP 1: Update workout details
      const workoutDetailsData = {
        workoutID: editingWorkout.workoutID || editingWorkout.id,
        workoutName: editingWorkout.name,
        workoutDesc: editingWorkout.description,
        workoutLevel: editingWorkout.difficulty,
        creatorID: userId,
      };

      console.log("Step 1: Updating workout details");
      const detailsResponse = await fetch(
        `${API_BASE_URL}/update_workout_details.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workoutDetailsData),
        }
      );

      const detailsText = await detailsResponse.text();
      console.log("Details update response:", detailsText);

      let detailsData;
      try {
        detailsData = JSON.parse(detailsText);
        if (!detailsData.success) {
          throw new Error(
            detailsData.error || "Failed to update workout details"
          );
        }
      } catch (parseError) {
        console.error("Failed to parse details response:", parseError);
        throw new Error("Invalid response from server during details update");
      }

      // STEP 2: Delete existing exercises
      console.log("Step 2: Deleting existing exercises");
      const deleteResponse = await fetch(
        `${API_BASE_URL}/delete_workout_exercises.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workoutID: editingWorkout.workoutID || editingWorkout.id,
          }),
        }
      );

      const deleteText = await deleteResponse.text();
      console.log("Delete exercises response:", deleteText);

      try {
        const deleteData = JSON.parse(deleteText);
        if (!deleteData.success) {
          console.warn(
            "Warning: Failed to delete existing exercises, continuing anyway"
          );
          // Continue even if delete fails
        }
      } catch (parseError) {
        console.warn(
          "Warning: Could not parse delete response, continuing anyway"
        );
      }

      // STEP 3: Add new exercises
      if (editingWorkout.exercises && editingWorkout.exercises.length > 0) {
        console.log("Step 3: Adding new exercises");

        const exercisesData = {
          workoutID: editingWorkout.workoutID || editingWorkout.id,
          exercises: editingWorkout.exercises.map((ex) => ({
            exerciseName: ex.name || ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps || 0,
          })),
        };

        console.log(
          "Sending exercise data:",
          JSON.stringify(exercisesData, null, 2)
        );

        const addResponse = await fetch(
          `${API_BASE_URL}/add_workout_exercises.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(exercisesData),
          }
        );

        const addText = await addResponse.text();
        console.log("Add exercises response:", addText);

        try {
          const addData = JSON.parse(addText);
          if (!addData.success) {
            console.warn("Warning: Some exercises might not have been added");
          }
        } catch (parseError) {
          console.warn("Warning: Could not parse add exercises response");
        }
      }

      // Final: Success handling
      console.log("Update complete, refreshing workouts list");
      await fetchWorkouts();
      setEditingWorkout(null);
      setShowEditModal(false);
      Alert.alert("Success", "Workout updated successfully");
    } catch (error) {
      console.error("Edit workout error:", error);
      Alert.alert(
        "Update Failed",
        `Could not update workout: ${error.message}. Check the console for details.`,
        [{ text: "OK" }, { text: "Retry", onPress: handleEditWorkout }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorkout = async () => {
    try {
      const selectedTraineeIds = Object.keys(selectedTrainees).filter(
        (id) => selectedTrainees[id]
      );

      if (selectedTraineeIds.length === 0) {
        Alert.alert("Error", "Please select at least one trainee");
        return;
      }

      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/assign_workout.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutID: selectedWorkout.workoutID, // Changed from id to workoutID
          traineeIDs: selectedTraineeIds,
          assignedByID: userId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to assign workout");
      }

      const selectedTraineeNames = selectedTraineeIds
        .map((id) => trainees.find((trainee) => trainee.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      setSelectedTrainees({});
      setShowAssignModal(false);
      Alert.alert(data.message, `Assigned to: ${selectedTraineeNames}`, [
        {
          text: "OK",
          onPress: () => fetchWorkouts(), // Refresh the workouts list
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDeleteWorkout = async (workoutId) => {
    try {
      if (!userId) {
        throw new Error("User ID is missing");
      }

      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/soft_delete_workout.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: workoutId,
          creatorID: userId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      await fetchWorkouts();
      setSelectedWorkout(null);
      Alert.alert("Success", "Workout has been archived");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTraineeSelection = (traineeId) => {
    setSelectedTrainees((prev) => ({
      ...prev,
      [traineeId]: !prev[traineeId],
    }));
  };

  const addExercise = (isEditing = false) => {
    if (isEditing) {
      const updatedExercises = [
        ...editingWorkout.exercises,
        { name: "", sets: 3, reps: 10 },
      ];
      setEditingWorkout({ ...editingWorkout, exercises: updatedExercises });
    } else {
      const updatedExercises = [
        ...newWorkout.exercises,
        { name: "", sets: 3, reps: 10 },
      ];
      setNewWorkout({ ...newWorkout, exercises: updatedExercises });
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const removeExercise = (index, isEditing = false) => {
    if (isEditing) {
      const updatedExercises = [...editingWorkout.exercises];
      updatedExercises.splice(index, 1);
      setEditingWorkout({ ...editingWorkout, exercises: updatedExercises });
    } else {
      const updatedExercises = [...newWorkout.exercises];
      updatedExercises.splice(index, 1);
      setNewWorkout({ ...newWorkout, exercises: updatedExercises });
    }
  };

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => setSelectedWorkout(item)}
    >
      {item.assignedToName && (
        <View style={styles.assignedToContainer}>
          <Ionicons name="person-outline" size={14} color="#6397C9" />
          <Text style={styles.assignedToText}>{item.assignedToName}</Text>
        </View>
      )}
      <Text style={styles.workoutName}>{item.workoutName}</Text>
      <Text style={styles.workoutDescription}>{item.workoutDesc}</Text>

      <View style={styles.workoutMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="barbell-outline" size={16} color="#6397C9" />
          <Text style={styles.metaText}>{item.workoutLevel}</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="list-outline" size={16} color="#6397C9" />
          <Text style={styles.metaText}>
            {item.exercises ? item.exercises.length : 0} exercises
          </Text>
        </View>

        {item.workoutProgress && (
          <View style={styles.metaItem}>
            <Ionicons name="trending-up-outline" size={16} color="#6397C9" />
            <Text style={styles.metaText}>{item.workoutProgress}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTraineeItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.traineeItem,
        selectedTrainees[item.id] && styles.selectedTraineeItem,
      ]}
      onPress={() => toggleTraineeSelection(item.id)}
    >
      <View style={styles.traineeInfo}>
        <Text style={styles.traineeName}>{item.name}</Text>
        <Text style={styles.traineeEmail}>{item.email}</Text>
      </View>
      <View
        style={[
          styles.traineeCheckbox,
          selectedTrainees[item.id] && styles.selectedTraineeCheckbox,
        ]}
      >
        {selectedTrainees[item.id] && (
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && workouts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6397C9" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
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

        {/* Search and Add Workout controls */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
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

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* New Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "main" && styles.activeTab]}
            onPress={() => setActiveTab("main")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "main" && styles.activeTabText,
              ]}
            >
              Main Workouts
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

      {filteredWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={64} color="#333" />
          <Text style={styles.emptyStateText}>No workouts found</Text>
          <Text style={styles.emptyStateSubText}>
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first workout to get started"}
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) =>
            item.workoutID
              ? item.workoutID.toString()
              : Math.random().toString()
          }
          contentContainerStyle={styles.workoutList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Workout Details Modal */}
      <Modal visible={!!selectedWorkout} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedWorkout(null)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedWorkout?.workoutName}
              </Text>
            </View>

            <Text style={styles.modalDescription}>
              {selectedWorkout?.workoutDesc}
            </Text>

            <View style={styles.modalMeta}>
              <View style={styles.modalMetaItem}>
                <Ionicons name="barbell-outline" size={16} color="#6397C9" />
                <Text style={styles.modalMetaText}>
                  {selectedWorkout?.workoutLevel}
                </Text>
              </View>

              {selectedWorkout?.assignedToName && (
                <View style={styles.modalMetaItem}>
                  <Ionicons name="person-outline" size={16} color="#6397C9" />
                  <Text style={styles.modalMetaText}>
                    {selectedWorkout?.assignedToName}
                  </Text>
                </View>
              )}

              {selectedWorkout?.workoutProgress && (
                <View style={styles.modalMetaItem}>
                  <Ionicons
                    name="trending-up-outline"
                    size={16}
                    color="#6397C9"
                  />
                  <Text style={styles.modalMetaText}>
                    {selectedWorkout?.workoutProgress}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.exercisesTitle}>Exercises:</Text>

            <ScrollView style={styles.exerciseList}>
              {selectedWorkout?.exercises?.map((exercise, index) => (
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setEditingWorkout(selectedWorkout);
                  setShowEditModal(true);
                  setSelectedWorkout(null);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Workout</Text>
              </TouchableOpacity>

              {/* Only show assign button for main workouts (unassigned) */}
              {activeTab === "main" &&
                selectedWorkout &&
                !selectedWorkout.assignedToID && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => {
                      setShowAssignModal(true);
                    }}
                  >
                    <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.assignButtonText}>
                      Assign to Trainees
                    </Text>
                  </TouchableOpacity>
                )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    "Archive Workout",
                    "Are you sure you want to archive this workout?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Archive",
                        onPress: () =>
                          handleSoftDeleteWorkout(selectedWorkout.workoutID),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="archive-outline" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Workout Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create New Workout</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Workout Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter workout name"
                  placeholderTextColor="#666"
                  value={newWorkout.name}
                  onChangeText={(text) =>
                    setNewWorkout({ ...newWorkout, name: text })
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter workout description"
                  placeholderTextColor="#666"
                  value={newWorkout.description}
                  onChangeText={(text) =>
                    setNewWorkout({ ...newWorkout, description: text })
                  }
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Difficulty Level</Text>
                <View style={styles.difficultyContainer}>
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyOption,
                        newWorkout.difficulty === level &&
                          styles.selectedDifficultyOption,
                      ]}
                      onPress={() =>
                        setNewWorkout({ ...newWorkout, difficulty: level })
                      }
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          newWorkout.difficulty === level &&
                            styles.selectedDifficultyText,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.exercisesContainer}>
                <View style={styles.exercisesHeader}>
                  <Text style={styles.label}>Exercises</Text>
                  <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={() => addExercise(false)}
                  >
                    <Ionicons name="add-circle" size={24} color="#6397C9" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {newWorkout.exercises.length === 0 ? (
                  <View style={styles.noExercisesContainer}>
                    <Ionicons name="fitness-outline" size={32} color="#666" />
                    <Text style={styles.noExercisesText}>
                      No exercises added yet
                    </Text>
                    <Text style={styles.noExercisesSubText}>
                      Tap "Add Exercise" to get started
                    </Text>
                  </View>
                ) : (
                  newWorkout.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseEditItem}>
                      <View style={styles.exerciseEditHeader}>
                        <Text style={styles.exerciseEditTitle}>
                          Exercise {index + 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeExercise(index, false)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#FF4444"
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.exerciseEditField}>
                        <Text style={styles.exerciseEditLabel}>
                          Exercise Name
                        </Text>
                        <TextInput
                          style={styles.exerciseEditInput}
                          placeholder="e.g., Push-ups, Squats"
                          placeholderTextColor="#666"
                          value={exercise.name}
                          onChangeText={(text) => {
                            const updatedExercises = [...newWorkout.exercises];
                            updatedExercises[index].name = text;
                            setNewWorkout({
                              ...newWorkout,
                              exercises: updatedExercises,
                            });
                          }}
                        />
                      </View>

                      <View style={styles.exerciseEditRow}>
                        <View style={styles.exerciseEditField}>
                          <Text style={styles.exerciseEditLabel}>Sets</Text>
                          <TextInput
                            style={styles.exerciseEditInput}
                            placeholder="3"
                            placeholderTextColor="#666"
                            value={exercise.sets.toString()}
                            onChangeText={(text) => {
                              const updatedExercises = [
                                ...newWorkout.exercises,
                              ];
                              updatedExercises[index].sets =
                                Number.parseInt(text) || 0;
                              setNewWorkout({
                                ...newWorkout,
                                exercises: updatedExercises,
                              });
                            }}
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={styles.exerciseEditField}>
                          <Text style={styles.exerciseEditLabel}>
                            Reps/Duration
                          </Text>
                          <TextInput
                            style={styles.exerciseEditInput}
                            placeholder="10 or 30 seconds"
                            placeholderTextColor="#666"
                            value={
                              exercise.reps
                                ? exercise.reps.toString()
                                : exercise.duration
                            }
                            onChangeText={(text) => {
                              const updatedExercises = [
                                ...newWorkout.exercises,
                              ];
                              if (Number.parseInt(text)) {
                                updatedExercises[index].reps =
                                  Number.parseInt(text);
                                delete updatedExercises[index].duration;
                              } else {
                                updatedExercises[index].duration = text;
                                delete updatedExercises[index].reps;
                              }
                              setNewWorkout({
                                ...newWorkout,
                                exercises: updatedExercises,
                              });
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitButton,
                newWorkout.exercises.length === 0 && styles.disabledButton,
              ]}
              onPress={handleAddWorkout}
              disabled={newWorkout.exercises.length === 0}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.submitButtonText}>Create Workout</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Workout</Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Workout Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter workout name"
                  placeholderTextColor="#666"
                  value={editingWorkout?.name}
                  onChangeText={(text) =>
                    setEditingWorkout({ ...editingWorkout, name: text })
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter workout description"
                  placeholderTextColor="#666"
                  value={editingWorkout?.description}
                  onChangeText={(text) =>
                    setEditingWorkout({ ...editingWorkout, description: text })
                  }
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Difficulty Level</Text>
                <View style={styles.difficultyContainer}>
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyOption,
                        editingWorkout?.difficulty === level &&
                          styles.selectedDifficultyOption,
                      ]}
                      onPress={() =>
                        setEditingWorkout({
                          ...editingWorkout,
                          difficulty: level,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          editingWorkout?.difficulty === level &&
                            styles.selectedDifficultyText,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.exercisesContainer}>
                <View style={styles.exercisesHeader}>
                  <Text style={styles.label}>Exercises</Text>
                  <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={() => addExercise(true)}
                  >
                    <Ionicons name="add-circle" size={24} color="#6397C9" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {editingWorkout?.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseEditItem}>
                    <View style={styles.exerciseEditHeader}>
                      <Text style={styles.exerciseEditTitle}>
                        Exercise {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeExercise(index, true)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#FF4444"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.exerciseEditField}>
                      <Text style={styles.exerciseEditLabel}>
                        Exercise Name
                      </Text>
                      <TextInput
                        style={styles.exerciseEditInput}
                        placeholder="e.g., Push-ups, Squats"
                        placeholderTextColor="#666"
                        value={exercise.name}
                        onChangeText={(text) => {
                          const updatedExercises = [
                            ...editingWorkout.exercises,
                          ];
                          updatedExercises[index].name = text;
                          setEditingWorkout({
                            ...editingWorkout,
                            exercises: updatedExercises,
                          });
                        }}
                      />
                    </View>

                    <View style={styles.exerciseEditRow}>
                      <View style={styles.exerciseEditField}>
                        <Text style={styles.exerciseEditLabel}>Sets</Text>
                        <TextInput
                          style={styles.exerciseEditInput}
                          placeholder="3"
                          placeholderTextColor="#666"
                          value={exercise.sets.toString()}
                          onChangeText={(text) => {
                            const updatedExercises = [
                              ...editingWorkout.exercises,
                            ];
                            updatedExercises[index].sets =
                              Number.parseInt(text) || 0;
                            setEditingWorkout({
                              ...editingWorkout,
                              exercises: updatedExercises,
                            });
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={styles.exerciseEditField}>
                        <Text style={styles.exerciseEditLabel}>
                          Reps/Duration
                        </Text>
                        <TextInput
                          style={styles.exerciseEditInput}
                          placeholder="10 or 30 seconds"
                          placeholderTextColor="#666"
                          value={
                            exercise.reps
                              ? exercise.reps.toString()
                              : exercise.duration
                          }
                          onChangeText={(text) => {
                            const updatedExercises = [
                              ...editingWorkout.exercises,
                            ];
                            if (Number.parseInt(text)) {
                              updatedExercises[index].reps =
                                Number.parseInt(text);
                              delete updatedExercises[index].duration;
                            } else {
                              updatedExercises[index].duration = text;
                              delete updatedExercises[index].reps;
                            }
                            setEditingWorkout({
                              ...editingWorkout,
                              exercises: updatedExercises,
                            });
                          }}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitButton,
                editingWorkout?.exercises.length === 0 && styles.disabledButton,
              ]}
              onPress={handleEditWorkout}
              disabled={editingWorkout?.exercises.length === 0}
            >
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Assign Workout Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAssignModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Assign Workout</Text>
            </View>

            <Text style={styles.assignText}>
              Assign "{selectedWorkout?.name}" to trainees:
            </Text>

            {trainees.length === 0 ? (
              <View style={styles.noTraineesContainer}>
                <Ionicons name="people-outline" size={48} color="#666" />
                <Text style={styles.noTraineesText}>No trainees found</Text>
                <Text style={styles.noTraineesSubText}>
                  Add trainees to assign workouts
                </Text>
              </View>
            ) : (
              <FlatList
                data={trainees}
                renderItem={renderTraineeItem}
                keyExtractor={(item) =>
                  item.id ? item.id.toString() : Math.random().toString()
                }
                style={styles.traineesList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                Object.values(selectedTrainees).filter(Boolean).length === 0 &&
                  styles.disabledButton,
              ]}
              onPress={handleAssignWorkout}
              disabled={
                Object.values(selectedTrainees).filter(Boolean).length === 0
              }
            >
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                Assign to{" "}
                {Object.values(selectedTrainees).filter(Boolean).length}{" "}
                trainee(s)
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
    padding: 20,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  // FIXED: New layout for search and add button
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    borderWidth: 1,
    borderColor: "#444",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 0, // Remove default padding that might interfere
  },
  addButton: {
    backgroundColor: "#6397C9",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutList: {
    padding: 20,
  },
  workoutItem: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignedToContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  assignedToText: {
    color: "#6397C9",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  workoutDescription: {
    color: "#CCCCCC",
    marginBottom: 15,
    lineHeight: 20,
  },
  workoutMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
    gap: 15,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#CCCCCC",
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalDescription: {
    color: "#CCCCCC",
    marginBottom: 15,
  },
  modalMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 10,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  modalMetaText: {
    color: "#CCCCCC",
    marginLeft: 5,
    fontSize: 14,
  },
  exercisesTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  exerciseList: {
    maxHeight: 200,
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
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#6397C9",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  assignButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  assignButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#6397C9",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#444",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyOption: {
    backgroundColor: "#2A2A2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333333",
  },
  selectedDifficultyOption: {
    backgroundColor: "#6397C9",
    borderColor: "#6397C9",
  },
  difficultyText: {
    color: "#CCCCCC",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedDifficultyText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  exercisesContainer: {
    marginBottom: 20,
  },
  exercisesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addExerciseText: {
    color: "#6397C9",
    marginLeft: 8,
    fontWeight: "600",
  },
  noExercisesContainer: {
    backgroundColor: "#333333",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  noExercisesText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  noExercisesSubText: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
  },
  exerciseEditItem: {
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  exerciseEditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  exerciseEditTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  exerciseEditField: {
    marginBottom: 12,
    flex: 1,
  },
  exerciseEditLabel: {
    color: "#CCCCCC",
    marginBottom: 6,
    fontSize: 14,
  },
  exerciseEditInput: {
    backgroundColor: "#444444",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  exerciseEditRow: {
    flexDirection: "row",
    gap: 12,
  },
  submitButton: {
    backgroundColor: "#6397C9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#555555",
    opacity: 0.7,
  },
  assignText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  traineesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  traineeItem: {
    backgroundColor: "#2A2A2A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#333333",
  },
  selectedTraineeItem: {
    backgroundColor: "#1E3A5F",
    borderColor: "#6397C9",
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  traineeEmail: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  traineeCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#6397C9",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  selectedTraineeCheckbox: {
    backgroundColor: "#6397C9",
  },
  noTraineesContainer: {
    backgroundColor: "#333333",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  noTraineesText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  noTraineesSubText: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 15,
    fontSize: 16,
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
    marginVertical: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#6397C9",
  },
  tabText: {
    color: "#CCC",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default WorkoutsScreen;
