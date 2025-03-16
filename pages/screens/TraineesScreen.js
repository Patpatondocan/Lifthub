"use client";

import { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TraineesScreen = () => {
  const [trainees, setTrainees] = useState([
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@example.com",
      notes: "Focusing on weight loss",
    },
    {
      id: "2",
      name: "Bob Wilson",
      email: "bob@example.com",
      notes: "Building muscle mass",
    },
    {
      id: "3",
      name: "Carol Martinez",
      email: "carol@example.com",
      notes: "Improving flexibility",
    },
  ]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTrainee, setNewTrainee] = useState({
    name: "",
    email: "",
    notes: "",
  });
  const [editingTrainee, setEditingTrainee] = useState(null);

  const handleAddTrainee = () => {
    if (newTrainee.name && newTrainee.email) {
      setTrainees([...trainees, { id: Date.now().toString(), ...newTrainee }]);
      setNewTrainee({ name: "", email: "", notes: "" });
      setShowAddModal(false);
    }
  };

  const handleEditTrainee = () => {
    if (editingTrainee) {
      setTrainees(
        trainees.map((t) => (t.id === editingTrainee.id ? editingTrainee : t))
      );
      setEditingTrainee(null);
      setShowEditModal(false);
    }
  };

  const renderTraineeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.traineeItem}
      onPress={() => {
        setEditingTrainee(item);
        setShowEditModal(true);
      }}
    >
      <Text style={styles.traineeName}>{item.name}</Text>
      <Text style={styles.traineeEmail}>{item.email}</Text>
      {item.notes && <Text style={styles.traineeNotes}>{item.notes}</Text>}
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

      <FlatList
        data={trainees}
        renderItem={renderTraineeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.traineeList}
      />

      {/* Add Trainee Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Trainee</Text>
            <TextInput
              style={styles.input}
              placeholder="Trainee Name"
              placeholderTextColor="#666"
              value={newTrainee.name}
              onChangeText={(text) =>
                setNewTrainee({ ...newTrainee, name: text })
              }
            />
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
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddTrainee}
            >
              <Text style={styles.modalButtonText}>Add Trainee</Text>
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

      {/* Edit Trainee Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Trainee</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Trainee Name"
              placeholderTextColor="#666"
              value={editingTrainee?.name}
              onChangeText={(text) =>
                setEditingTrainee({ ...editingTrainee, name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={editingTrainee?.email}
              onChangeText={(text) =>
                setEditingTrainee({ ...editingTrainee, email: text })
              }
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              placeholderTextColor="#666"
              value={editingTrainee?.notes}
              onChangeText={(text) =>
                setEditingTrainee({ ...editingTrainee, notes: text })
              }
              multiline
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEditTrainee}
            >
              <Text style={styles.modalButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
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
  traineeList: {
    padding: 15,
  },
  traineeItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 8,
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
  backButton: {
    marginRight: 10,
  },
});

export default TraineesScreen;
