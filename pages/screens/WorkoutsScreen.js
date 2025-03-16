"use client";

import { useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([
    {
      id: "1",
      name: "Full Body Workout",
      description: "Complete body workout routine",
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
      exercises: [
        { name: "Bench Press", sets: 4, reps: 10 },
        { name: "Pull-ups", sets: 3, reps: 8 },
        { name: "Bicep Curls", sets: 3, reps: 12 },
      ],
    },
  ]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    exercises: [],
  });
  const [editingWorkout, setEditingWorkout] = useState(null);
  const scrollViewRef = useRef(null);

  const handleAddWorkout = () => {
    if (newWorkout.name) {
      setWorkouts([...workouts, { id: Date.now().toString(), ...newWorkout }]);
      setNewWorkout({ name: "", description: "", exercises: [] });
      setShowAddModal(false);
    }
  };

  const handleEditWorkout = () => {
    if (editingWorkout) {
      setWorkouts(
        workouts.map((w) => (w.id === editingWorkout.id ? editingWorkout : w))
      );
      setEditingWorkout(null);
      setShowEditModal(false);
    }
  };

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => setSelectedWorkout(item)}
    >
      <Text style={styles.workoutName}>{item.name}</Text>
      <Text style={styles.workoutDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>
        {item.sets} sets x {item.reps ? `${item.reps} reps` : item.duration}
      </Text>
    </View>
  );

  const addExercise = () => {
    const updatedExercises = [
      ...editingWorkout.exercises,
      { name: "", sets: 0, reps: 0 },
    ];
    setEditingWorkout({ ...editingWorkout, exercises: updatedExercises });
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.workoutList}
      />

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
              <Text style={styles.modalTitle}>{selectedWorkout?.name}</Text>
            </View>
            <Text style={styles.modalDescription}>
              {selectedWorkout?.description}
            </Text>
            <Text style={styles.exercisesTitle}>Exercises:</Text>
            <FlatList
              data={selectedWorkout?.exercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.exerciseList}
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingWorkout(selectedWorkout);
                setShowEditModal(true);
                setSelectedWorkout(null);
              }}
            >
              <Text style={styles.editButtonText}>Edit Workout</Text>
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Add New Workout</Text>
            <TextInput
              style={styles.input}
              placeholder="Workout Name"
              placeholderTextColor="#666"
              value={newWorkout.name}
              onChangeText={(text) =>
                setNewWorkout({ ...newWorkout, name: text })
              }
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="#666"
              value={newWorkout.description}
              onChangeText={(text) =>
                setNewWorkout({ ...newWorkout, description: text })
              }
              multiline
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddWorkout}
            >
              <Text style={styles.modalButtonText}>Add Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
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
            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
              <TextInput
                style={styles.input}
                placeholder="Workout Name"
                placeholderTextColor="#666"
                value={editingWorkout?.name}
                onChangeText={(text) =>
                  setEditingWorkout({ ...editingWorkout, name: text })
                }
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#666"
                value={editingWorkout?.description}
                onChangeText={(text) =>
                  setEditingWorkout({ ...editingWorkout, description: text })
                }
                multiline
              />
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              {editingWorkout?.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseEditItem}>
                  <TextInput
                    style={styles.exerciseInput}
                    placeholder="Exercise Name"
                    placeholderTextColor="#666"
                    value={exercise.name}
                    onChangeText={(text) => {
                      const updatedExercises = [...editingWorkout.exercises];
                      updatedExercises[index].name = text;
                      setEditingWorkout({
                        ...editingWorkout,
                        exercises: updatedExercises,
                      });
                    }}
                  />
                  <TextInput
                    style={styles.exerciseInput}
                    placeholder="Sets"
                    placeholderTextColor="#666"
                    value={exercise.sets.toString()}
                    onChangeText={(text) => {
                      const updatedExercises = [...editingWorkout.exercises];
                      updatedExercises[index].sets = Number.parseInt(text) || 0;
                      setEditingWorkout({
                        ...editingWorkout,
                        exercises: updatedExercises,
                      });
                    }}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.exerciseInput}
                    placeholder="Reps or Duration"
                    placeholderTextColor="#666"
                    value={
                      exercise.reps
                        ? exercise.reps.toString()
                        : exercise.duration
                    }
                    onChangeText={(text) => {
                      const updatedExercises = [...editingWorkout.exercises];
                      if (Number.parseInt(text)) {
                        updatedExercises[index].reps = Number.parseInt(text);
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
              ))}
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={addExercise}
              >
                <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEditWorkout}
            >
              <Text style={styles.modalButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1A1A1A",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    backgroundColor: "#6397C9",
    padding: 10,
    borderRadius: 20,
  },
  workoutList: {
    padding: 15,
  },
  workoutItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  workoutDescription: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  modalDescription: {
    color: "#CCCCCC",
    fontSize: 16,
    marginBottom: 15,
  },
  exercisesTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  exerciseList: {
    marginBottom: 15,
  },
  exerciseItem: {
    backgroundColor: "#333333",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  exerciseDetails: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#FFFFFF",
  },
  editButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  exerciseEditItem: {
    backgroundColor: "#333333",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  exerciseInput: {
    backgroundColor: "#444444",
    color: "#FFFFFF",
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
  },
  addExerciseButton: {
    backgroundColor: "#555555",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  addExerciseButtonText: {
    color: "#FFFFFF",
  },
  backButton: {
    marginRight: 10,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
});

export default WorkoutsScreen;
