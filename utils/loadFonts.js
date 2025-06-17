import * as Font from "expo-font";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

/**
 * Load all required icon fonts for the application
 * This is needed for proper icon rendering on web and native platforms
 */
export const loadFonts = async () => {
  // Use a consistent approach for both platforms
  // Use the built-in font loading mechanism from Expo vector icons
  try {
    // For both web and native, load the .font objects which contain the correct mappings
    await Font.loadAsync({
      ...Ionicons.font,
      ...MaterialIcons.font,
      ...FontAwesome.font,
      ...MaterialCommunityIcons.font,
    });

    console.log("Fonts loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading fonts:", error);
    return false;
  }
};
