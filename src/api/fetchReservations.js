import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const fetchReservations = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("📦 Sending token:", token); // <-- Add this line for debugging

    const response = await axios.get(
      "https://api-backend-urlr.onrender.com/api/reservation/my",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Fetched reservations:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Fetch reservations error:", err);
    throw err;
  }
};
