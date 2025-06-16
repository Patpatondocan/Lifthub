import { Platform } from "react-native";
import { Html5Qrcode } from "html5-qrcode";

export const initializeScanner = async (containerId, onSuccess, onError) => {
  if (Platform.OS === "web") {
    const html5QrCode = new Html5Qrcode(containerId);
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      onSuccess,
      onError
    );

    return html5QrCode;
  }
  return null;
};

export const stopScanner = async (scanner) => {
  if (Platform.OS === "web" && scanner) {
    try {
      await scanner.stop();
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  }
};
