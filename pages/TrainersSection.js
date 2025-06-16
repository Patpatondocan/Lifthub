"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

const TrainersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerDetails, setTrainerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add these new state variables for trainee removal
  const [traineeToRemove, setTraineeToRemove] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // API base URL based on platform
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    ios: "http://localhost/lifthub",
    default: "http://localhost/lifthub",
  });

  // Fetch trainers on component mount
  useEffect(() => {
    fetchTrainers();
  }, []);

  // Filter trainers when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTrainers(trainers);
    } else {
      const filtered = trainers.filter(
        (trainer) =>
          trainer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trainer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trainer.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTrainers(filtered);
    }
  }, [searchQuery, trainers]);

  // Fetch trainers from API
  const fetchTrainers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/get_trainers_with_assignments.php`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTrainers(data.trainers || []);
        setFilteredTrainers(data.trainers || []);
      } else {
        throw new Error(data.message || "Failed to fetch trainers");
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      Alert.alert("Error", "Failed to load trainers. Please try again later.");

      // Mock data for development
      if (__DEV__) {
        const mockTrainers = [
          {
            userID: "1",
            userName: "trainer1",
            fullName: "John Smith",
            email: "john@example.com",
            contactNum: "123-456-7890",
            traineeCount: 5,
            assignedWorkoutCount: 12,
          },
          {
            userID: "2",
            userName: "trainer2",
            fullName: "Sarah Johnson",
            email: "sarah@example.com",
            contactNum: "987-654-3210",
            traineeCount: 3,
            assignedWorkoutCount: 8,
          },
        ];
        setTrainers(mockTrainers);
        setFilteredTrainers(mockTrainers);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trainer details
  const fetchTrainerDetails = async (trainerID) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/get_trainers_with_assignments.php?trainerID=${trainerID}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTrainerDetails(data);
        setShowDetailsModal(true);
      } else {
        throw new Error(data.message || "Failed to fetch trainer details");
      }
    } catch (error) {
      console.error("Error fetching trainer details:", error);
      Alert.alert(
        "Error",
        "Failed to load trainer details. Please try again later."
      );

      // Mock data for development if needed
      if (__DEV__) {
        // Provide mock trainer details for testing
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleTrainerPress = (trainer) => {
    setSelectedTrainer(trainer);
    fetchTrainerDetails(trainer.userID);
  };

  // Add this function to handle trainee removal
  const handleRemoveTrainee = (trainee) => {
    setTraineeToRemove(trainee);
    setShowRemoveModal(true);
  };

  // Add this function to confirm and process trainee removal
  const confirmRemoveTrainee = async () => {
    if (!traineeToRemove || !selectedTrainer) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/remove_trainee.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainerID: selectedTrainer.userID,
          traineeID: traineeToRemove.id || traineeToRemove.userID,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the trainees list in the selected trainer's details
        setSelectedTrainerDetails((prev) => ({
          ...prev,
          trainees: prev.trainees.filter(
            (trainee) =>
              trainee.id !== traineeToRemove.id &&
              trainee.userID !== traineeToRemove.userID
          ),
        }));

        // Also update trainee count in the trainer list
        setTrainers(
          trainers.map((trainer) =>
            trainer.userID === selectedTrainer.userID
              ? {
                  ...trainer,
                  traineeCount: Math.max(0, trainer.traineeCount - 1),
                }
              : trainer
          )
        );

        setTraineeToRemove(null);
        setShowRemoveModal(false);
        toast.success("Trainee removed successfully");
      } else {
        throw new Error(data.message || "Failed to remove trainee");
      }
    } catch (error) {
      console.error("Error removing trainee:", error);
      toast.error(error.message || "Error removing trainee");
    } finally {
      setIsLoading(false);
      setShowRemoveModal(false);
    }
  };

  const renderTrainerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.trainerCard}
      onPress={() => handleTrainerPress(item)}
    >
      <View style={styles.trainerHeader}>
        <View style={styles.trainerAvatar}>
          <Ionicons name="fitness" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.trainerInfo}>
          <Text style={styles.trainerName}>{item.fullName}</Text>
          <Text style={styles.trainerUsername}>@{item.userName}</Text>
        </View>
      </View>

      <View style={styles.trainerStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={18} color="#6397C9" />
          <Text style={styles.statValue}>{item.traineeCount}</Text>
          <Text style={styles.statLabel}>Trainees</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={18} color="#6397C9" />
          <Text style={styles.statValue}>{item.assignedWorkoutCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
      </View>

      <View style={styles.trainerContact}>
        <View style={styles.contactItem}>
          <Ionicons name="mail-outline" size={14} color="#666" />
          <Text style={styles.contactText}>{item.email}</Text>
        </View>
        {item.contactNum && (
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.contactText}>{item.contactNum}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTraineeItem = ({ item }) => (
    <View style={styles.traineeItem}>
      <View style={styles.traineeHeader}>
        <Text style={styles.traineeName}>{item.fullName}</Text>
        <Text style={styles.traineeUsername}>@{item.userName}</Text>
      </View>

      <View style={styles.traineeDetails}>
        <View style={styles.traineeDetailItem}>
          <Ionicons name="mail-outline" size={16} color="#6397C9" />
          <Text style={styles.traineeDetailText}>{item.email}</Text>
        </View>

        {item.contactNum && (
          <View style={styles.traineeDetailItem}>
            <Ionicons name="call-outline" size={16} color="#6397C9" />
            <Text style={styles.traineeDetailText}>{item.contactNum}</Text>
          </View>
        )}

        <View style={styles.traineeDetailItem}>
          <Ionicons name="calendar-outline" size={16} color="#6397C9" />
          <Text style={styles.traineeDetailText}>
            Assigned on: {item.assignmentDate}
          </Text>
        </View>
      </View>
    </View>
  );

  // Modify the renderTraineesList function to add the remove button
  const renderTraineesList = () => {
    if (!selectedTrainerDetails) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Trainees</Text>
        <View style={styles.traineeListContainer}>
          {selectedTrainerDetails.trainees &&
          selectedTrainerDetails.trainees.length > 0 ? (
            selectedTrainerDetails.trainees.map((trainee) => (
              <View
                key={trainee.id || trainee.userID}
                style={styles.traineeItem}
              >
                <View style={styles.traineeInfo}>
                  <Text style={styles.traineeName}>
                    {trainee.name || trainee.fullName}
                  </Text>
                  <Text style={styles.traineeEmail}>{trainee.email}</Text>
                  <Text style={styles.traineeDate}>
                    Assigned: {trainee.assignmentDate || "Unknown date"}
                  </Text>
                </View>

                {/* Add Remove Button */}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveTrainee(trainee)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#FF4444"
                  />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noTraineesText}>No trainees assigned yet</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trainers</Text>

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
              placeholder="Search trainers..."
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6397C9" />
          <Text style={styles.loadingText}>Loading trainers...</Text>
        </View>
      ) : filteredTrainers.length > 0 ? (
        <FlatList
          data={filteredTrainers}
          renderItem={renderTrainerItem}
          keyExtractor={(item) => item.userID.toString()}
          contentContainerStyle={styles.trainerList}
          showsVerticalScrollIndicator={true}
          refreshing={isLoading}
          onRefresh={fetchTrainers}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness" size={48} color="#333" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No trainers match your search"
              : "No trainers found"}
          </Text>
        </View>
      )}

      {/* Trainer Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {trainerDetails?.trainer?.fullName || "Trainer Details"}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6397C9" />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : trainerDetails ? (
              <ScrollView style={styles.modalScrollContent}>
                <View style={styles.trainerDetailCard}>
                  <View style={styles.trainerDetailHeader}>
                    <View style={styles.trainerDetailAvatar}>
                      <Ionicons name="fitness" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.trainerDetailInfo}>
                      <Text style={styles.trainerDetailName}>
                        {trainerDetails.trainer.fullName}
                      </Text>
                      <Text style={styles.trainerDetailUsername}>
                        @{trainerDetails.trainer.userName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.trainerDetailContact}>
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={18} color="#6397C9" />
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>
                        {trainerDetails.trainer.email}
                      </Text>
                    </View>

                    {trainerDetails.trainer.contactNum && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color="#6397C9"
                        />
                        <Text style={styles.detailLabel}>Contact:</Text>
                        <Text style={styles.detailValue}>
                          {trainerDetails.trainer.contactNum}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.trainerDetailStats}>
                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatValue}>
                        {trainerDetails.traineeCount}
                      </Text>
                      <Text style={styles.detailStatLabel}>Trainees</Text>
                    </View>

                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatValue}>
                        {trainerDetails.assignedWorkoutCount}
                      </Text>
                      <Text style={styles.detailStatLabel}>Workouts</Text>
                    </View>
                  </View>
                </View>

                {renderTraineesList()}
              </ScrollView>
            ) : (
              <Text style={styles.errorText}>
                Failed to load trainer details
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Add the Remove Trainee Confirmation Modal */}
      <Modal
        visible={showRemoveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRemoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Remove Trainee</Text>

            <Text style={styles.confirmationText}>
              Are you sure you want to remove{" "}
              {traineeToRemove?.name || traineeToRemove?.fullName} from{" "}
              {selectedTrainer?.fullName}'s trainees list?
            </Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowRemoveModal(false)}
              >
                <Text style={styles.confirmationButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={confirmRemoveTrainee}
              >
                <Text style={styles.confirmationButtonText}>Remove</Text>
              </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: "#1A1A1A",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  searchContainer: {
    marginBottom: 5,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
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
  trainerList: {
    padding: 15,
    paddingBottom: 30,
  },
  trainerCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  trainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  trainerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 3,
  },
  trainerUsername: {
    color: "#6397C9",
    fontSize: 14,
  },
  trainerStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 15,
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    marginRight: 5,
  },
  statLabel: {
    color: "#999999",
    fontSize: 14,
  },
  trainerContact: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    color: "#CCCCCC",
    fontSize: 14,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 15,
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
    borderRadius: 15,
    width: "90%",
    maxWidth: 600,
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  modalScrollContent: {
    maxHeight: "90%",
  },
  trainerDetailCard: {
    backgroundColor: "#272727",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  trainerDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  trainerDetailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  trainerDetailInfo: {
    flex: 1,
  },
  trainerDetailName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 3,
  },
  trainerDetailUsername: {
    color: "#6397C9",
    fontSize: 16,
  },
  trainerDetailContact: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingVertical: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#CCCCCC",
    fontSize: 16,
    width: 70,
    marginLeft: 10,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  trainerDetailStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 15,
  },
  detailStatItem: {
    flex: 1,
    alignItems: "center",
  },
  detailStatValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  detailStatLabel: {
    color: "#6397C9",
    fontSize: 14,
    marginTop: 5,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  traineeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#262626",
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  traineeEmail: {
    color: "#CCCCCC",
    fontSize: 14,
  },
  traineeDate: {
    color: "#999999",
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
  },
  confirmationModal: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  confirmationTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  confirmationText: {
    color: "#CCCCCC",
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  confirmationButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#333333",
  },
  confirmButton: {
    backgroundColor: "#FF4444",
  },
  confirmationButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyTrainees: {
    backgroundColor: "#222222",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTraineesText: {
    color: "#666666",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#FF4444",
    textAlign: "center",
    padding: 20,
  },
});

export default TrainersSection;
