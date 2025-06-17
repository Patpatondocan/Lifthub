import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";
import App from "./pages/App";

// Polyfill URL for Hermes - use url-parse as direct replacement
if (typeof URL === "undefined") {
  const URLParse = require("url-parse");
  global.URL = URLParse;
}

const appName = "LiftHub";
AppRegistry.registerComponent(appName, () => App);

// Handle web platform rendering
if (typeof document !== "undefined") {
  const rootTag =
    document.getElementById("root") || document.getElementById("app");
  AppRegistry.runApplication(appName, {
    rootTag,
  });
} else {
  registerRootComponent(App);
}
