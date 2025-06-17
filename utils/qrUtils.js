import { Html5Qrcode } from "html5-qrcode";
import React from "react";
import { View, Platform } from "react-native";
import QRCode from "qrcode.react";

// Scanner instance management
let activeScanner = null;
let onScanCallback = null;
let isScanActive = false;
let animationFrameId = null;
let mediaStream = null;
let videoElement = null;
let canvasElement = null;

// Add debounce mechanism to prevent multiple rapid calls
let scanInProgress = false;

// QR code validation
export const isValidQRCode = (text) => {
  if (
    /^LIFTHUB-(MEMBER|TRAINER)-\d+$/.test(text) || // LiftHub member/trainer ID
    /^DAYPASS-[A-Za-z\s]+$/.test(text) || // Day pass with name
    /^[A-Z0-9]{8,}$/.test(text) // Alphanumeric code
  ) {
    return true;
  }
  return false;
};

// Initialize QR scanner
export const initQRScanner = async (
  elementId,
  successCallback,
  errorCallback
) => {
  try {
    // If an active scanner exists, stop and clear it first
    if (activeScanner) {
      try {
        await stopScanner(activeScanner);
      } catch (e) {
        console.warn("Error stopping previous scanner:", e);
      }
      activeScanner = null;
    }

    // Only create a new scanner if not already present
    const scanner = new Html5Qrcode(elementId, {
      fps: 2, // Lower frames per second to reduce scan frequency
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    });

    activeScanner = scanner;
    onScanCallback = successCallback;

    if (Platform.OS === "web") {
      // Only create one instance
      const html5QrCode = scanner;
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };
      // Do not start here, just return the instance
      return html5QrCode;
    }

    return scanner;
  } catch (error) {
    console.error("Error initializing QR scanner:", error);
    if (errorCallback) errorCallback(error.toString());
    return null;
  }
};

// Start scanning
export const startScanner = async (scanner, onSuccess, onError) => {
  try {
    if (!scanner) {
      if (onError) onError("No scanner instance provided");
      return false;
    }

    // Prevent double start
    if (scanner._isScanning || scanner.isScanning) {
      return true;
    }

    // Reset scan in progress flag
    scanInProgress = false;

    const qrCodeSuccessCallback = (decodedText) => {
      if (scanInProgress) return;
      scanInProgress = true;
      if (typeof onSuccess === "function") {
        onSuccess(decodedText);
      }
      setTimeout(() => {
        scanInProgress = false;
      }, 1000);
    };

    const qrCodeErrorCallback = (error) => {
      // Suppress common parse errors from being shown in the UI or console
      if (
        typeof error === "string" &&
        (error.includes(
          "No MultiFormat Readers were able to detect the code"
        ) ||
          error.includes("parse error"))
      ) {
        // Silently ignore these errors
        return;
      }
      if (onError) onError(error);
    };

    if (Platform.OS === "web" && scanner) {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
      scanner._isScanning = true;
      isScanActive = true;
      return true;
    }

    // For non-web platforms
    await scanner.start(
      { facingMode: "environment" },
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    );

    // Mark as scanning
    scanner._isScanning = true;
    isScanActive = true;
    return true;
  } catch (error) {
    console.error("Error starting scanner:", error);
    if (onError) onError(error.toString());
    return false;
  }
};

// Stop scanning
export const stopScanner = async (scanner) => {
  // Only attempt to stop if scanner exists and is scanning
  if (!scanner) return Promise.resolve(false);

  try {
    // Check if scanning first to avoid errors
    if (scanner.isScanning) {
      await scanner.stop();
    }

    // Reset scan in progress flag
    scanInProgress = false;
    isScanActive = false;
    return true;
  } catch (error) {
    console.error("Error stopping scanner:", error);
    return false;
  }
};

// Pause and resume scanning
export const pauseScanner = async (scanner) => {
  if (!scanner) return Promise.resolve(false);

  try {
    await scanner.pause();
    return true;
  } catch (error) {
    console.error("Error pausing scanner:", error);
    return false;
  }
};

export const resumeScanner = async (scanner) => {
  if (!scanner) return Promise.resolve(false);

  try {
    // Only resume if not already scanning to avoid errors
    if (!scanner.isScanning) {
      await scanner.resume();
    }
    return true;
  } catch (error) {
    console.error("Error resuming scanner:", error);
    return false;
  }
};

// Simple QR code component for display
export const QRCodeComponent = ({ value, size = 200 }) => {
  return (
    <View>
      <QRCode
        value={value || "https://lifthub.com"}
        size={size}
        level="H"
        includeMargin={true}
        renderAs="svg"
      />
    </View>
  );
};
