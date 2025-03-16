"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MembersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [months, setMonths] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [newMember, setNewMember] = useState({
    username: "",
    type: "",
    name: "",
    email: "",
    contact: "",
    password: "",
    membership: "",
  });

  // Sample data - replace with your PHP data
  const members = [
    {
      id: 1,
      name: "Spiderman Sean Ymannuer",
      contact: "123-456-7890",
      membership: "Premium",
    },
    { id: 2, name: "Glen", contact: "098-765-4321", membership: "Basic" },
  ];

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberActions(true);
  };

  const handleAddMembership = () => {
    // Implement add membership logic
    console.log("Adding months:", months);
    setShowAddMembership(false);
    setMonths("");
  };

  const handleResetPassword = () => {
    // Implement reset password logic
    console.log("Reset password with staff password:", staffPassword);
    setShowResetPassword(false);
    setStaffPassword("");
  };

  const handleAddMember = () => {
    // Implement add member logic
    console.log("Adding new member:", newMember);
    setShowAddMember(false);
    setNewMember({
      username: "",
      fullname: "",
      email: "",
      password: "",
      contactNum: "",
      userType: "",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddMember(true)}
        >
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.memberList}>
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberItem}
            onPress={() => handleMemberClick(member)}
          >
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberDetails}>
              {member.contact} - {member.membership}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Member Actions Modal */}
      <Modal
        visible={showMemberActions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Member Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowMemberActions(false);
                setShowAddMembership(true);
              }}
            >
              <Text style={styles.actionButtonText}>Add Membership</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowMemberActions(false);
                setShowResetPassword(true);
              }}
            >
              <Text style={styles.actionButtonText}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMemberActions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Membership Modal */}
      <Modal
        visible={showAddMembership}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMembership(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Membership</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of months"
              placeholderTextColor="#666"
              value={months}
              onChangeText={setMonths}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMembership}
            >
              <Text style={styles.submitButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMembership(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter staff password"
              placeholderTextColor="#666"
              value={staffPassword}
              onChangeText={setStaffPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.submitButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowResetPassword(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMember(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#666"
              value={newMember.username}
              onChangeText={(text) =>
                setNewMember({ ...newMember, username: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Type"
              placeholderTextColor="#666"
              value={newMember.type}
              onChangeText={(text) =>
                setNewMember({ ...newMember, type: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#666"
              value={newMember.name}
              onChangeText={(text) =>
                setNewMember({ ...newMember, name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={newMember.email}
              onChangeText={(text) =>
                setNewMember({ ...newMember, email: text })
              }
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contact #"
              placeholderTextColor="#666"
              value={newMember.contact}
              onChangeText={(text) =>
                setNewMember({ ...newMember, contact: text })
              }
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={newMember.password}
              onChangeText={(text) =>
                setNewMember({ ...newMember, password: text })
              }
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Membership"
              placeholderTextColor="#666"
              value={newMember.membership}
              onChangeText={(text) =>
                setNewMember({ ...newMember, membership: text })
              }
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMember}
            >
              <Text style={styles.submitButtonText}>Add Member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMember(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#6397C9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    boxShadow: "0px 2px 4px rgba(99, 151, 201, 0.3)",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  memberList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  memberItem: {
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  memberDetails: {
    color: "#666",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    elevation: 5,
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.25)",
  },
  modalTitle: {
    color: "#6397C9",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#111111",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#6397C9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#333333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default MembersSection;
