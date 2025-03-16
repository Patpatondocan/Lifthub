"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ProgressScreen = () => {
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to fetch trainees data
    setTimeout(() => {
      setTrainees([
        {
          id: "1",
          name: "Alice Johnson",
          progress: 75,
          workouts: [
            { id: "w1", name: "Full Body Workout", completed: true },
            { id: "w2", name: "Upper Body Focus", completed: false },
            { id: "w3", name: "Cardio Blast", completed: true },
          ],
        },
        {
          id: "2",
          name: "Bob Wilson",
          progress: 60,
          workouts: [
            { id: "w1", name: "Full Body Workout", completed: true },
            { id: "w2", name: "Upper Body Focus", completed: true },
            { id: "w4", name: "Leg Day", completed: false },
          ],
        },
        {
          id: "3",
          name: "Carol Martinez",
          progress: 90,
          workouts: [
            { id: "w2", name: "Upper Body Focus", completed: true },
            { id: "w3", name: "Cardio Blast", completed: true },
            { id: "w4", name: "Leg Day", completed: true },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const renderTraineeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.traineeItem}
      onPress={() => setSelectedTrainee(item)}
    >
      <View style={styles.traineeInfo}>
        <Text style={styles.traineeName}>{item.name}</Text>
        <Text style={styles.traineeProgress}>{item.progress}% Complete</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
      </View>
      <Ionicons name="chevron-forward" size={24} color="#6397C9" />
    </TouchableOpacity>
  );

  const toggleWorkoutCompletion = (workoutId) => {
    setSelectedTrainee((prevTrainee) => {
      const updatedWorkouts = prevTrainee.workouts.map((workout) =>
        workout.id === workoutId
          ? { ...workout, completed: !workout.completed }
          : workout
      );
      const completedWorkouts = updatedWorkouts.filter(
        (workout) => workout.completed
      ).length;
      const newProgress = Math.round(
        (completedWorkouts / updatedWorkouts.length) * 100
      );

      return {
        ...prevTrainee,
        workouts: updatedWorkouts,
        progress: newProgress,
      };
    });

    setTrainees((prevTrainees) =>
      prevTrainees.map((trainee) =>
        trainee.id === selectedTrainee.id
          ? { ...selectedTrainee, progress: selectedTrainee.progress }
          : trainee
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trainee Progress</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      ) : (
        <FlatList
          data={trainees}
          renderItem={renderTraineeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.traineeList}
        />
      )}

      <Modal visible={!!selectedTrainee} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setSelectedTrainee(null)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedTrainee?.name}</Text>
            </View>
            <Text style={styles.modalProgress}>
              Overall Progress: {selectedTrainee?.progress}%
            </Text>
            <View style={styles.modalProgressBar}>
              <View
                style={[
                  styles.modalProgressFill,
                  { width: `${selectedTrainee?.progress}%` },
                ]}
              />
            </View>
            <ScrollView style={styles.workoutList}>
              {selectedTrainee?.workouts.map((workout) => (
                <View key={workout.id} style={styles.workoutItem}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Switch
                    value={workout.completed}
                    onValueChange={() => toggleWorkoutCompletion(workout.id)}
                    trackColor={{ false: "#767577", true: "#6397C9" }}
                    thumbColor={workout.completed ? "#f4f3f4" : "#f4f3f4"}
                  />
                </View>
              ))}
            </ScrollView>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  traineeList: {
    flexGrow: 1,
  },
  traineeItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  traineeProgress: {
    color: "#6397C9",
    fontSize: 14,
  },
  progressBar: {
    height: 5,
    width: "50%",
    backgroundColor: "#333333",
    borderRadius: 5,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
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
  modalProgress: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  modalProgressBar: {
    height: 10,
    backgroundColor: "#333333",
    borderRadius: 5,
    marginBottom: 20,
  },
  modalProgressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 5,
  },
  backButton: {
    marginRight: 10,
  },
  workoutList: {
    maxHeight: "70%",
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default ProgressScreen;
