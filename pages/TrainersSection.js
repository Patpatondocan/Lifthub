"use client";

import { useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TrainersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data - replace with your PHP data
  const trainers = [
    {
      id: 1,
      name: "James Reid",
      trainees: ["Goku", "Steve Rogers", "Luffy", "Daeho"],
    },
    {
      id: 2,
      name: "Trump",
      trainees: ["Messi", "Ronaldo"],
    },
    {
      id: 3,
      name: "Patrick",
      trainees: ["Stephanie", "Arabela", "B. Iligan"],
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
            placeholder="Search trainers or trainees"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Trainers Grid */}
      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {trainers.map((trainer) => (
            <View key={trainer.id} style={styles.trainerCard}>
              <View style={styles.trainerHeader}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#6397C9"
                />
                <Text style={styles.trainerName}>{trainer.name}</Text>
              </View>
              <View style={styles.traineesContainer}>
                <Text style={styles.traineesTitle}>
                  Trainees ({trainer.trainees.length})
                </Text>
                {trainer.trainees.map((trainee, index) => (
                  <View key={index} style={styles.traineeItem}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.traineeName}>{trainee}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
    paddingHorizontal: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  trainerCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 15,
    width: "100%",
    maxWidth: 350,
    flex: 1,
    minWidth: 300,
  },
  trainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  trainerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  traineesContainer: {
    marginTop: 15,
  },
  traineesTitle: {
    color: "#6397C9",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  traineeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  traineeName: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default TrainersSection;
