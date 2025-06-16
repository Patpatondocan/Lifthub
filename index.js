import { AppRegistry, Platform } from "react-native";
import { registerRootComponent } from "expo";
import App from "./pages/App";

// Polyfill URL for Hermes
if (typeof URL === "undefined") {
  global.URL = require("url-parse");
}

const appName = "LiftHub";

// Register the app first
AppRegistry.registerComponent(appName, () => App);

// Then handle platform-specific initialization
if (Platform.OS === "web") {
  const rootTag =
    document.getElementById("root") || document.getElementById("app");
  AppRegistry.runApplication(appName, {
    rootTag,
  });
} else {
  registerRootComponent(App);
}
