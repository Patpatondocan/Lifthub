"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WorkoutsSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Sample data - replace with your PHP data
  const workouts = [
    {
      id: 1,
      name: "Full Body Workout",
      description: "Complete full body workout routine",
      exercises: [
        { name: "Squats", sets: 3, reps: 12 },
        { name: "Push-ups", sets: 3, reps: 15 },
        { name: "Deadlifts", sets: 3, reps: 10 },
      ],
      duration: "45 mins",
      difficulty: "Intermediate",
    },
    {
      id: 2,
      name: "Upper Body Focus",
      description: "Upper body strength training",
      exercises: [
        { name: "Bench Press", sets: 4, reps: 10 },
        { name: "Pull-ups", sets: 3, reps: 8 },
        { name: "Shoulder Press", sets: 3, reps: 12 },
      ],
      duration: "30 mins",
      difficulty: "Advanced",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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
        </View>
      </View>

      <View style={styles.content}>
        {/* Workouts List */}
        <View style={styles.workoutsList}>
          <ScrollView>
            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[
                  styles.workoutItem,
                  selectedWorkout?.id === workout.id &&
                    styles.workoutItemActive,
                ]}
                onPress={() => setSelectedWorkout(workout)}
              >
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDuration}>{workout.duration}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Workout Details */}
        <View style={styles.detailsPanel}>
          {selectedWorkout ? (
            <ScrollView>
              <Text style={styles.detailsTitle}>{selectedWorkout.name}</Text>
              <View style={styles.detailsCard}>
                <Text style={styles.detailsSubtitle}>Description</Text>
                <Text style={styles.detailsText}>
                  {selectedWorkout.description}
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsSubtitle}>Difficulty</Text>
                <Text style={styles.detailsText}>
                  {selectedWorkout.difficulty}
                </Text>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsSubtitle}>Exercises</Text>
                {selectedWorkout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exercise.sets} sets × {exercise.reps} reps
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
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
  },
  searchContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
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
  content: {
    flex: 1,
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 15,
  },
  workoutsList: {
    flex: 1,
    maxWidth: 300,
  },
  workoutItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  workoutItemActive: {
    backgroundColor: "#6397C9",
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  workoutDuration: {
    color: "#666",
    fontSize: 14,
  },
  detailsPanel: {
    flex: 2,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingVertical: 10,
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  exerciseDetails: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
  },
  noSelection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSelectionText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
});

export default WorkoutsSection;
