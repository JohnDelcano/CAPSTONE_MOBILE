import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { io, Socket } from "socket.io-client";

// ✅ Your backend URL
const API_URL = "https://api-backend-urlr.onrender.com";

// ✅ Create a reusable socket variable
let socket: Socket | null = null;

// ✅ Export a getter to access the socket elsewhere
export const getSocket = () => socket;

// ✅ Join a personal user room
export const joinUserRoom = async (): Promise<Socket | null> => {
  if (socket && socket.connected) {
    console.log("⚡️ Socket already connected.");
    return socket; // Already connected
  }

  const token = await AsyncStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ No token found — cannot join user room.");
    return null;
  }

  try {
    // ✅ Fetch the current student’s ID using their token
    const res = await axios.get(`${API_URL}/api/students/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Handle both `student._id` or `_id` returned from your backend
    const userId = res.data?.student?._id || res.data?._id;
    if (!userId) {
      console.warn("⚠️ No user ID found from /me endpoint.");
      return null;
    }

    // ✅ Connect to the socket server only if not connected
    if (!socket) {
      socket = io(API_URL, {
        transports: ["websocket"], // Ensure we use websocket transport
        reconnection: true, // Enable reconnection attempts
        reconnectionAttempts: 5, // Retry up to 5 attempts
        reconnectionDelay: 3000, // Wait 3 seconds between reconnection attempts
      });

      // Listen for socket connection and emit `joinUser` once connected
      socket.on("connect", () => {
        console.log("✅ Socket connected");
        socket?.emit("joinUser", userId); // Join the personal room for the user
        console.log(`📡 Joined personal room for user ${userId}`);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("connect_error", (err) => {
        console.error("⚠️ Socket connection error:", err.message);
      });
    }

    return socket;
  } catch (err) {
    console.error("❌ joinUserRoom error:", err);
    return null;
  }
};
