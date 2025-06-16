import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";

// Cross-platform QR code component that works on both web and mobile
export const QRCodeComponent = ({
  value,
  size = 150,
  backgroundColor = "white",
  color = "black",
}) => {
  // For web platforms, use the QR code libraries typically used in web
  if (Platform.OS === "web") {
    // Using basic QR code renderer for web
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: backgroundColor,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
            value
          )}`}
          width={size}
          height={size}
          alt="QR Code"
        />
      </div>
    );
  }

  // For mobile platforms, use react-native-qrcode-svg
  return (
    <View
      style={{
        width: size,
        height: size,
        padding: 10,
        backgroundColor: backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <QRCode
        value={value}
        size={size - 20}
        color={color}
        backgroundColor={backgroundColor}
      />
    </View>
  );
};

// Scanner initialization function - using the script injection approach
export const initQRScanner = async (
  elementId,
  onScanSuccess,
  onScanFailure
) => {
  if (Platform.OS === "web") {
    try {
      console.log("Initializing QR Scanner on element:", elementId);

      // Check if the HTML5QrCode script is already loaded
      if (!window.Html5Qrcode) {
        // Dynamically load the script if not already loaded
        await loadHTML5QrCodeScript();
      }

      // Now we can safely use the Html5Qrcode class from the global scope
      if (!window.Html5Qrcode) {
        throw new Error("Html5Qrcode library failed to load");
      }

      const html5QrCode = new window.Html5Qrcode(elementId);

      // Add scanning state to the scanner instance
      html5QrCode.isScanning = false;
      html5QrCode.isPaused = false;

      // Create a debounced version of the success callback to prevent multiple rapid scans
      let lastScanTime = 0;
      const SCAN_COOLDOWN = 2000; // 2 seconds cooldown between scans

      const debouncedSuccessCallback = (decodedText) => {
        const now = Date.now();
        if (now - lastScanTime > SCAN_COOLDOWN) {
          lastScanTime = now;

          // Pause scanning immediately to prevent multiple detections
          html5QrCode.isPaused = true;

          // Call the user's callback
          onScanSuccess(decodedText);
        }
      };

      const qrCodeSuccessCallback = (decodedText) => {
        // Only process if not paused
        if (!html5QrCode.isPaused) {
          debouncedSuccessCallback(decodedText);
        }
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Don't start scanning yet, just return the configured scanner
      html5QrCode.configuredConfig = config;
      html5QrCode.configuredSuccessCallback = qrCodeSuccessCallback;
      html5QrCode.configuredErrorCallback = (errorMessage) => {
        // Filter out common non-error messages related to scanning
        if (
          !errorMessage.includes("No QR code found") &&
          !html5QrCode.isPaused
        ) {
          onScanFailure(errorMessage);
        }
      };

      return html5QrCode;
    } catch (error) {
      console.error("QR Scanner initialization error:", error);
      onScanFailure(error.toString());
      return null;
    }
  } else {
    console.warn(
      "QR Scanner web initialization not supported on this platform"
    );
    return null;
  }
};

// Start scanning with the initialized scanner
export const startScanner = async (scanner) => {
  if (!scanner) return false;

  try {
    if (scanner.isScanning) {
      console.log("Scanner is already active");
      return true;
    }

    // Reset the pause state
    scanner.isPaused = false;

    await scanner.start(
      { facingMode: "environment" },
      scanner.configuredConfig,
      scanner.configuredSuccessCallback,
      scanner.configuredErrorCallback
    );

    scanner.isScanning = true;
    return true;
  } catch (error) {
    console.error("Failed to start scanner:", error);
    return false;
  }
};

// Pause scanning (but don't stop the camera)
export const pauseScanner = (scanner) => {
  if (!scanner) return;
  scanner.isPaused = true;
};

// Resume scanning after pause
export const resumeScanner = (scanner) => {
  if (!scanner) return;
  scanner.isPaused = false;
};

// Stop scanner and release resources
export const stopScanner = (scanner) => {
  if (!scanner) return;

  try {
    // Check if scanner is active before stopping
    if (scanner.isScanning) {
      console.log("Stopping active QR scanner");
      scanner
        .stop()
        .then(() => {
          scanner.isScanning = false;
          console.log("QR Scanner stopped successfully");
        })
        .catch((error) => console.error("Error stopping QR scanner:", error));
    } else {
      console.log("QR Scanner not active, no need to stop");
    }
  } catch (error) {
    console.error("Error while stopping QR scanner:", error);
  }
};

// Helper function to load the HTML5QrCode script
const loadHTML5QrCodeScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Html5Qrcode) {
      // Script already loaded
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.async = true;

    script.onload = () => {
      console.log("HTML5QrCode script loaded successfully");
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Failed to load HTML5QrCode script"));
    };

    document.body.appendChild(script);
  });
};
