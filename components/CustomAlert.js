import React, { createContext, useContext, useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CustomAlertContext = createContext();

export const useCustomAlert = () => useContext(CustomAlertContext);

export const CustomAlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const showAlert = (alertTitle, alertMessage) => {
    setTitle(alertTitle);
    setMessage(alertMessage);
    setVisible(true);
  };

  const hideAlert = () => setVisible(false);

  return (
    <CustomAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <View
            style={{
              backgroundColor: "#1A1A1A",
              padding: 30,
              borderRadius: 16,
              alignItems: "center",
              maxWidth: 320,
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#FF4444"
              style={{ marginBottom: 10 }}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {message}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#6397C9",
                paddingVertical: 10,
                paddingHorizontal: 30,
                borderRadius: 8,
              }}
              onPress={hideAlert}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CustomAlertContext.Provider>
  );
};
