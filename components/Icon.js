import React from "react";
import { Platform, Text } from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

/**
 * A wrapper component for icons that works reliably on both web and native platforms
 *
 * @param {Object} props - Component props
 * @param {string} props.type - Icon family ('ionicons', 'material', 'fontawesome', 'materialcommunity')
 * @param {string} props.name - Icon name
 * @param {number} props.size - Icon size
 * @param {string} props.color - Icon color
 * @param {Object} props.style - Additional style for the icon
 * @returns {React.Component} Icon component
 */
const Icon = ({ type, name, size, color, style, ...props }) => {
  // Normalize the type (lowercase and remove spaces/hyphens)
  const iconType = type ? type.toLowerCase().replace(/[-\s]/g, "") : "ionicons";

  // Default properties
  const iconSize = size || 24;
  const iconColor = color || "#000";

  // Handle icon types
  switch (iconType) {
    case "material":
    case "materialicons":
      return (
        <MaterialIcons
          name={name}
          size={iconSize}
          color={iconColor}
          style={style}
          {...props}
        />
      );

    case "fontawesome":
    case "fa":
      return (
        <FontAwesome
          name={name}
          size={iconSize}
          color={iconColor}
          style={style}
          {...props}
        />
      );

    case "materialcommunity":
    case "materialcommunityicons":
    case "mci":
      return (
        <MaterialCommunityIcons
          name={name}
          size={iconSize}
          color={iconColor}
          style={style}
          {...props}
        />
      );

    case "ionicons":
    case "ion":
    default:
      return (
        <Ionicons
          name={name}
          size={iconSize}
          color={iconColor}
          style={style}
          {...props}
        />
      );
  }
};

export default Icon;
