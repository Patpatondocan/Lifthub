"use client";

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TraineesScreen = () => {
  const [trainees, setTrainees] = useState([
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@example.com",
      notes: "Focusing on weight loss",
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
      email: "bob@example.com",
      notes: "Building muscle mass",
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
      email: "carol@example.com",
      notes: "Improving flexibility",
      progress: 90,
      workouts: [
        { id: "w2", name: "Upper Body Focus", completed: true },
        { id: "w3", name: "Cardio Blast", completed: true },
        { id: "w4", name: "Leg Day", completed: true },
      ],
    },
  ]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrainee, setNewTrainee] = useState({
    name: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddTrainee = () => {
    if (newTrainee.name && newTrainee.email) {
      setTrainees([
        ...trainees,
        {
          id: Date.now().toString(),
          ...newTrainee,
          progress: 0,
          workouts: [],
        },
      ]);
      setNewTrainee({ name: "", email: "", notes: "" });
      setShowAddModal(false);
    }
  };

  const renderTraineeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.traineeItem}
      onPress={() => setSelectedTrainee(item)}
    >
      <View style={styles.traineeInfo}>
        <Text style={styles.traineeName}>{item.name}</Text>
        <Text style={styles.traineeEmail}>{item.email}</Text>
        {item.notes && <Text style={styles.traineeNotes}>{item.notes}</Text>}
      </View>
      <View style={styles.progressContainer}>
        <Text style={styles.traineeProgress}>{item.progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trainees</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trainees...</Text>
        </View>
      ) : (
        <FlatList
          data={trainees}
          renderItem={renderTraineeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.traineeList}
        />
      )}

      {/* Add Trainee Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Trainee</Text>
            </View>
            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Trainee Name"
                  placeholderTextColor="#666"
                  value={newTrainee.name}
                  onChangeText={(text) =>
                    setNewTrainee({ ...newTrainee, name: text })
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={newTrainee.email}
                  onChangeText={(text) =>
                    setNewTrainee({ ...newTrainee, email: text })
                  }
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notes"
                  placeholderTextColor="#666"
                  value={newTrainee.notes}
                  onChangeText={(text) =>
                    setNewTrainee({ ...newTrainee, notes: text })
                  }
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddTrainee}
              >
                <Text style={styles.modalButtonText}>Add Trainee</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Trainee Progress Modal */}
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

            <View style={styles.profileSection}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>
                  {selectedTrainee?.email}
                </Text>
              </View>
              {selectedTrainee?.notes && (
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Notes:</Text>
                  <Text style={styles.profileValue}>
                    {selectedTrainee?.notes}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <Text style={styles.modalProgress}>
                Overall: {selectedTrainee?.progress}%
              </Text>
              <View style={styles.modalProgressBar}>
                <View
                  style={[
                    styles.modalProgressFill,
                    { width: `${selectedTrainee?.progress}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Assigned Workouts</Text>
            <ScrollView style={styles.workoutList}>
              {selectedTrainee?.workouts.map((workout) => (
                <View key={workout.id} style={styles.workoutItem}>
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
              ))}
              {selectedTrainee?.workouts.length === 0 && (
                <Text style={styles.noWorkoutsText}>
                  No workouts assigned yet
                </Text>
              )}
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
    padding: 15,
  },
  traineeItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  traineeInfo: {
    marginBottom: 10,
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  traineeEmail: {
    color: "#CCCCCC",
    fontSize: 14,
    marginBottom: 5,
  },
  traineeNotes: {
    color: "#6397C9",
    fontSize: 14,
    fontStyle: "italic",
  },
  progressContainer: {
    marginTop: 5,
  },
  traineeProgress: {
    color: "#6397C9",
    fontSize: 14,
    marginBottom: 5,
    textAlign: "right",
  },
  progressBar: {
    height: 5,
    backgroundColor: "#333333",
    borderRadius: 5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    margin: 20,
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
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: "#6397C9",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
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
  backButton: {
    marginRight: 10,
  },
  profileSection: {
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#6397C9",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  profileItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  profileLabel: {
    color: "#CCCCCC",
    width: 80,
  },
  profileValue: {
    color: "#FFFFFF",
    flex: 1,
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
    marginBottom: 10,
  },
  modalProgressFill: {
    height: "100%",
    backgroundColor: "#6397C9",
    borderRadius: 5,
  },
  workoutList: {
    maxHeight: 200,
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
  noWorkoutsText: {
    color: "#CCCCCC",
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default TraineesScreen;
