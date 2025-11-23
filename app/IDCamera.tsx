import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraType, CameraView, FlashMode } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ID_RATIO = 85.6 / 53.98; // ID card ratio ~1.585

interface IDCameraProps {
  visible: boolean;
  onClose: () => void;
  onCaptured: (uri: string, base64: string) => void;
}

export default function IDCamera({ visible, onClose, onCaptured }: IDCameraProps) {
  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [loading, setLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  // Ask for camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  if (hasCameraPermission === false) {
    return (
      <Modal visible={visible} transparent>
        <View style={styles.permissionContainer}>
          <Text style={{ color: "#fff", textAlign: "center", marginBottom: 20 }}>
            Camera permission is required to capture your ID.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasCameraPermission(status === "granted");
            }}
            style={styles.permissionButton}
          >
            <Text style={{ color: "#fff" }}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // Capture and crop image to ID frame
  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      const { width, height } = photo;
      let cropWidth = width;
      let cropHeight = Math.round(cropWidth / ID_RATIO);
      if (cropHeight > height) {
        cropHeight = height;
        cropWidth = Math.round(cropHeight * ID_RATIO);
      }

      const originX = (width - cropWidth) / 2;
      const originY = (height - cropHeight) / 2;

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      onCaptured(cropped.uri, cropped.base64!);
    } catch (err) {
      console.error("Error capturing ID:", err);
      alert("Error capturing ID photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        {/* Camera preview */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={type}
          flash={flash}
        />

        {/* Overlay frame */}
        <View style={styles.overlay}>
          <Text style={styles.instruction}>
            Position your ID inside the frame
          </Text>
          <View style={styles.frameContainer}>
            <View style={styles.dim} />
            <View style={styles.centerRow}>
              <View style={styles.dim} />
              <View style={styles.idFrame} />
              <View style={styles.dim} />
            </View>
            <View style={styles.dim} />
          </View>
        </View>

        {/* Top buttons */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 20 }}>
            <TouchableOpacity onPress={() => setFlash(flash === "off" ? "on" : "off")}>
              <Ionicons
                name={flash === "off" ? "flash-off" : "flash"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType(type === "back" ? "front" : "back")}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Capture button */}
        <View style={styles.bottomControls}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <TouchableOpacity onPress={takePicture} style={styles.captureOuter}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  instruction: {
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  frameContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  centerRow: {
    flexDirection: "row",
  },
  dim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  idFrame: {
    width: Dimensions.get("window").width * 0.85,
    aspectRatio: ID_RATIO,
    borderWidth: 2,
    borderColor: "#00BFFF",
    borderRadius: 8,
  },
  topControls: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
});
