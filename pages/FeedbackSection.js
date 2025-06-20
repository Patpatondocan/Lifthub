"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createPortal } from "react-dom";

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API base URL based on platform
  const API_BASE_URL = Platform.select({
    android: "http://10.0.2.2/lifthub",
    ios: "http://localhost/lifthub",
    default: "http://localhost/lifthub",
  });

  // Add the missing functions and state
  const [trainerStats, setTrainerStats] = useState([]);

  // Fetch feedback data on component mount and when filter changes
  useEffect(() => {
    fetchFeedback();
  }, [activeFilter]);

  // Update the fetchFeedback function to include trainerStats
  const fetchFeedback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/get_feedback.php?filter=${activeFilter}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setFeedback(data.feedback);
        setFilteredFeedback(data.feedback);
        setTrainerStats(data.trainerStats || []);
      } else {
        throw new Error(data.error || "Failed to fetch feedback");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add the missing filter functions
  const filterTrainerFeedback = (feedbackList) =>
    feedbackList.filter((item) => item.type === "trainer");

  // Update the filter effect
  useEffect(() => {
    let filtered = feedback;
    if (activeFilter === "trainer") {
      filtered = filterTrainerFeedback(feedback);
    } else if (activeFilter === "general") {
      filtered = feedback.filter((item) => item.type === "general");
    } else if (activeFilter === "workout") {
      filtered = feedback.filter((item) => item.type === "workout");
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.workoutName &&
            item.workoutName
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (item.trainerName &&
            item.trainerName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredFeedback(filtered);
  }, [searchQuery, feedback, activeFilter]);

  // Add the print function
  const printFeedback = () => {
    const printable = document.getElementById("printable-feedback");
    if (printable) printable.style.display = "block";
    window.print();
    if (printable) printable.style.display = "none";
  };

  // Handler for filter buttons
  const handleFilterChange = (filter) => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
      setSearchQuery("");
    }
  };

  // Open feedback detail modal
  const openFeedbackModal = (item) => {
    setSelectedFeedback(item);
    setModalVisible(true);
  };

  // Submit new feedback
  const handleSubmitFeedback = async () => {
    if (!newFeedbackText.trim()) {
      alert("Please enter feedback text");
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would make an API call to submit new feedback
      // For now, let's just mock it
      setTimeout(() => {
        // Add to local state (in real app, you'd fetch fresh data)
        const newFeedbackItem = {
          id: Date.now().toString(),
          text: newFeedbackText,
          userName: "Current User",
          userType: "member",
          type: "general",
          date: new Date().toISOString(),
        };

        setFeedback([newFeedbackItem, ...feedback]);
        setFilteredFeedback([newFeedbackItem, ...filteredFeedback]);

        // Reset and close modal
        setNewFeedbackText("");
        setModalVisible(false);
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setIsSubmitting(false);
    }
  };

  // Filter button component
  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === value && styles.activeFilterButton,
      ]}
      onPress={() => handleFilterChange(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === value && styles.activeFilterText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Render feedback item
  const renderFeedbackItem = ({ item }) => (
    <TouchableOpacity
      style={styles.feedbackItem}
      onPress={() => openFeedbackModal(item)}
    >
      <View style={styles.feedbackHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userName}</Text>
            <View
              style={[
                styles.userTypeBadge,
                item.userType === "member"
                  ? styles.memberBadge
                  : styles.trainerBadge,
              ]}
            >
              <Text style={styles.userTypeText}>
                {item.userType === "member" ? "Member" : "Trainer"}
              </Text>
            </View>
            {item.type === "trainer" && item.trainerName && (
              <Text
                style={{ color: "#FFD700", fontWeight: "bold", marginTop: 2 }}
              >
                For Trainer: {item.trainerName}
              </Text>
            )}
            {item.type === "trainer" && item.rating && (
              <Text
                style={{ color: "#FFD700", fontWeight: "bold", marginTop: 2 }}
              >
                Rating: {item.rating} ★
              </Text>
            )}
          </View>
        </View>

        {item.workoutName && (
          <View style={styles.workoutInfoContainer}>
            <View style={styles.workoutBadge}>
              <Ionicons name="barbell-outline" size={14} color="#FFFFFF" />
              <Text style={styles.workoutName}>{item.workoutName}</Text>
            </View>
            {item.creatorName && (
              <Text style={styles.creatorName}>by {item.creatorName}</Text>
            )}
          </View>
        )}
      </View>

      {/* Add the date back */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ color: "#888888", fontSize: 12 }}>
          {item.date ? new Date(item.date).toLocaleString() : "N/A"}
        </Text>
      </View>

      <Text style={styles.feedbackText}>{item.text}</Text>
    </TouchableOpacity>
  );

  // In the modal content, when displaying selected feedback details
  const renderModalContent = () => (
    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
      <View style={styles.modalUserInfo}>
        <View style={styles.modalUserAvatar}>
          <Text style={styles.modalUserInitial}>
            {selectedFeedback.userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.modalUserDetails}>
          <Text style={styles.modalUserName}>{selectedFeedback.userName}</Text>
          <View
            style={[
              styles.userTypeBadge,
              selectedFeedback.userType === "member"
                ? styles.memberBadge
                : styles.trainerBadge,
            ]}
          >
            <Text style={styles.userTypeText}>
              {selectedFeedback.userType === "member" ? "Member" : "Trainer"}
            </Text>
          </View>
        </View>
      </View>

      {/* Feedback Date */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ color: "#6397C9", fontWeight: "bold" }}>Date:</Text>
        <Text style={{ color: "#fff" }}>
          {selectedFeedback.date
            ? new Date(selectedFeedback.date).toLocaleString()
            : "N/A"}
        </Text>
      </View>

      {selectedFeedback?.workoutName && (
        <View style={styles.modalWorkout}>
          <Text style={styles.modalLabel}>Workout:</Text>
          <View style={styles.modalWorkoutDetails}>
            <Text style={styles.modalWorkoutName}>
              {selectedFeedback.workoutName}
            </Text>
            {selectedFeedback.creatorName && (
              <Text style={styles.modalCreatorName}>
                Created by: {selectedFeedback.creatorName}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.modalFeedbackContainer}>
        <Text style={styles.modalLabel}>Feedback:</Text>
        <View style={styles.modalFeedbackBox}>
          <Text style={styles.modalFeedbackText}>{selectedFeedback.text}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header with search bar */}
      <View style={styles.header}>
        {/* Header with search bar */}
        <View style={styles.headerTop}>
          <Text style={styles.title}>User Feedback</Text>
          {/* Print & PDF Buttons (web only) */}
          {Platform.OS === "web" && (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    marginLeft: 20,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
                onPress={printFeedback}
              >
                <Ionicons
                  name="print-outline"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>Print Feedback</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
              placeholder="Search feedback"
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

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <FilterButton title="All Feedback" value="all" />
        <FilterButton title="General" value="general" />
        <FilterButton title="Workout" value="workout" />
        <FilterButton title="Trainer" value="trainer" />
      </View>

      {/* Feedback list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6397C9" />
          <Text style={styles.loadingText}>Loading feedback...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFeedback}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredFeedback.length > 0 ? (
        <FlatList
          data={filteredFeedback}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No feedback matches your search"
              : activeFilter === "all"
              ? "No feedback available"
              : activeFilter === "general"
              ? "No general feedback available"
              : "No workout-specific feedback available"}
          </Text>
        </View>
      )}

      {/* Feedback Detail/Add Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedFeedback ? "Feedback Details" : "Add New Feedback"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedFeedback ? (
              // Display feedback details
              renderModalContent()
            ) : (
              // New feedback form
              <View style={styles.modalBody}>
                <Text style={styles.modalPrompt}>What's on your mind?</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Enter your feedback here..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={5}
                  value={newFeedbackText}
                  onChangeText={setNewFeedbackText}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitFeedback}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Hidden printable section for web using portal */}
      {Platform.OS === "web" &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            id="printable-feedback"
            style={{
              display: "none",
              background: "#fff",
              color: "#000",
              padding: "20mm",
              position: "fixed",
              left: 0,
              top: 0,
              width: "210mm",
              minHeight: "297mm",
              maxWidth: "210mm",
              boxSizing: "border-box",
              zIndex: 9999,
              margin: "0 auto",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <h1
              style={{
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#000",
              }}
            >
              Feedback Report
            </h1>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "15px",
                color: "#000",
              }}
            >
              Feedback Details
            </h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid #000",
                marginBottom: "20px",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textAlign: "left",
                      width: "15%",
                    }}
                  >
                    User
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textAlign: "left",
                      width: "10%",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textAlign: "left",
                      width: "15%",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      textAlign: "left",
                      width: "60%",
                    }}
                  >
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "8px",
                        fontSize: "12px",
                        verticalAlign: "top",
                        wordWrap: "break-word",
                      }}
                    >
                      {item.userName || "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "8px",
                        fontSize: "12px",
                        verticalAlign: "top",
                      }}
                    >
                      {item.userType === "member" ? "Member" : "Trainer"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "8px",
                        fontSize: "12px",
                        verticalAlign: "top",
                        wordWrap: "break-word",
                      }}
                    >
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "8px",
                        fontSize: "12px",
                        verticalAlign: "top",
                        wordWrap: "break-word",
                        maxWidth: "300px",
                      }}
                    >
                      {item.text || "No feedback provided"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Trainer stats summary if available */}
            {trainerStats.length > 0 && (
              <>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#000",
                  }}
                >
                  Trainer Ratings Summary
                </h2>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "2px solid #000",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "8px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textAlign: "left",
                        }}
                      >
                        Trainer
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "8px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textAlign: "left",
                        }}
                      >
                        Average Rating
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "8px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textAlign: "left",
                        }}
                      >
                        Feedback Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainerStats.map((stat, idx) => (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9",
                        }}
                      >
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            fontSize: "12px",
                            verticalAlign: "top",
                          }}
                        >
                          {stat.trainerName}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            fontSize: "12px",
                            verticalAlign: "top",
                          }}
                        >
                          {stat.averageRating ?? "-"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            fontSize: "12px",
                            verticalAlign: "top",
                          }}
                        >
                          {stat.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>,
          document.body
        )}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    gap: 10,
  },
  filterButton: {
    backgroundColor: "#333333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: "#6397C9",
  },
  filterButtonText: {
    color: "#CCCCCC",
    fontWeight: "500",
    fontSize: 14,
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  listContent: {
    padding: 20,
  },
  feedbackItem: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  memberBadge: {
    backgroundColor: "#4CAF50",
  },
  trainerBadge: {
    backgroundColor: "#FF8C00",
  },
  userTypeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  workoutInfoContainer: {
    alignItems: "flex-end",
  },
  workoutBadge: {
    backgroundColor: "#333333",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  workoutName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  creatorName: {
    color: "#888888",
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
  feedbackText: {
    color: "#CCCCCC",
    fontSize: 15,
    lineHeight: 22,
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
    textAlign: "center",
    marginVertical: 15,
    fontSize: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
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
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 12,
  },
  modalUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6397C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  modalUserInitial: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUserName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  modalWorkout: {
    marginBottom: 20,
  },
  modalLabel: {
    color: "#6397C9",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalWorkoutDetails: {
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 12,
  },
  modalWorkoutName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalCreatorName: {
    color: "#AAAAAA",
    fontSize: 14,
    fontStyle: "italic",
  },
  modalFeedbackContainer: {
    flex: 1,
  },
  modalFeedbackBox: {
    backgroundColor: "#333333",
    padding: 15,
    borderRadius: 12,
    flex: 1,
  },
  modalFeedbackText: {
    color: "#CCCCCC",
    fontSize: 15,
    lineHeight: 22,
  },
  modalPrompt: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
  },
  feedbackInput: {
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  submitButton: {
    backgroundColor: "#6397C9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6397C9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default FeedbackSection;
