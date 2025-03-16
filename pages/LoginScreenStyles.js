import { StyleSheet, Dimensions } from "react-native";

const windowWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6397C9",
    marginTop: 8,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#333333",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    width: "100%",
  },
  loginButton: {
    backgroundColor: "#6397C9",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default styles;
