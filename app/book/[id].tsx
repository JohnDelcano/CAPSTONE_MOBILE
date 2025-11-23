import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getSocket, joinUserRoom } from "../../src/api/socket";

dayjs.extend(duration);

// ================== Constants ==================
const SOCKET_URL = "https://api-backend-urlr.onrender.com";
const BOOK_BASE_URL = `${SOCKET_URL}/api/books`;
const RESERVATION_BASE_URL = `${SOCKET_URL}/api/reservation`;
const STUDENT_BASE_URL = `${SOCKET_URL}/api/students`;
const RESERVATION_PICKUP_HOURS = 2;
const BORROW_DURATION_DAYS = 3;
const MAX_ACTIVE_RESERVATIONS = 3;

// ================== Component ==================
export default function BookDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [book, setBook] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeout = useRef<number | null>(null);

  // ================== Fetch user + book + reservation ==================
  const fetchAll = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!id) return;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [bookRes, userRes, reservationRes] = await Promise.allSettled([
        axios.get(`${BOOK_BASE_URL}/${id}`),
        token ? axios.get(`${STUDENT_BASE_URL}/me`, { headers }) : Promise.resolve(null),
        token ? axios.get(`${RESERVATION_BASE_URL}/my`, { headers }) : Promise.resolve(null),
      ]);

      if (bookRes.status === "fulfilled" && bookRes.value) {
        setBook(bookRes.value.data);
        navigation.setOptions?.({ title: bookRes.value.data.title });
      }

      if (userRes?.status === "fulfilled" && userRes.value)
        setUser(userRes.value.data?.student);

      if (reservationRes?.status === "fulfilled" && reservationRes.value) {
        const found = reservationRes.value.data?.reservations?.find((r: any) => {
          const bookId = typeof r.bookId === "string" ? r.bookId : r.bookId?._id;
          return (
            bookId === id &&
            !["cancelled", "returned", "expired", "completed", "declined"].includes(r.status)
          );
        });
        setReservation(found || null);
      }
    } catch (err) {
      console.log("❌ fetchAll error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigation]);

  // ================== On Focus Refresh ==================
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
  }, [fetchAll]);

  // ================== Countdown Timer ==================
  // ================== Countdown Timer ==================
useEffect(() => {
  if (!reservation) {
    setCountdown(null);
    return;
  }

  let end;
  if (reservation.status === "reserved") {
    end = reservation.expiresAt
      ? dayjs(reservation.expiresAt)
      : dayjs(reservation.createdAt).add(RESERVATION_PICKUP_HOURS, "hour");
  } else if (reservation.status === "approved") {
    end = reservation.dueDate
      ? dayjs(reservation.dueDate)  // Use custom due date
      : dayjs(reservation.updatedAt).add(BORROW_DURATION_DAYS, "day");  // Default 3-day
  } else {
    setCountdown(null);
    return;
  }

  const timer = setInterval(() => {
    const diff = end.diff(dayjs(), "second");
    if (diff <= 0) {
      clearInterval(timer);
      setCountdown("Expired");
    } else {
      const t = dayjs.duration(diff, "seconds");
      setCountdown(`${t.days()}d ${t.hours()}h ${t.minutes()}m`);
    }
  }, 1000);

  return () => clearInterval(timer);
}, [reservation]);


  // ================== Socket listener ==================
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      await joinUserRoom();
      const s = getSocket();
      if (!s) return;

      const debouncedRefresh = () => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        refreshTimeout.current = setTimeout(() => {
          if (mounted) fetchAll();
        }, 500);
      };

      const events = [
        "bookStatusUpdated",
        "reservationCreated",
        "reservationUpdated",
        "reservationApproved",
        "reservationCancelled",
        "bookReturned",
      ];

      events.forEach((event) => s.on(event, debouncedRefresh));

      // cleanup listener
      return () => {
        events.forEach((event) => s.off(event, debouncedRefresh));
      };
    };

    setupSocket();

    return () => {
      mounted = false;
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [fetchAll]);

  // ================== Reserve Book ==================
  const handleReserve = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Sign in required", "Please log in.");
    if (user?.status?.toLowerCase?.() !== "active")
      return Alert.alert("Account not verified", "Your account is pending admin approval.");

    try {
      const { data: myRes } = await axios.get(`${RESERVATION_BASE_URL}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const approvedCount = myRes.reservations.filter((r: any) => r.status === "approved").length;
      if (approvedCount >= MAX_ACTIVE_RESERVATIONS)
        return Alert.alert("Limit reached", `You can only borrow ${MAX_ACTIVE_RESERVATIONS} books.`);

      if ((book?.availableCount ?? 0) <= 0)
        return Alert.alert("Unavailable", "This book is currently unavailable.");

      const res = await axios.post(`${RESERVATION_BASE_URL}/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const newRes = res.data?.reservation;
      if (newRes) {
        setReservation({
          ...newRes,
          status: "reserved",
          expiresAt: newRes.expiresAt || dayjs().add(RESERVATION_PICKUP_HOURS, "hour").toISOString(),
        });
        fetchAll();
        Alert.alert(
          "Reserved",
          "Book reserved! Pick it up within 2 hours.\n\n⚠️ Please bring a valid ID when claiming your reserved book."
        );

      }
    } catch (err: any) {
      console.log("❌ Reserve error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.error || "Reservation failed.");
    }
  };

  // ================== Cancel Reservation ==================
  const handleCancel = async () => {
    if (!reservation?._id) return;
    const token = await AsyncStorage.getItem("token");
    try {
      await axios.delete(`${RESERVATION_BASE_URL}/${reservation._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
      Alert.alert("Cancelled", "Your reservation has been cancelled.");
    } catch {
      Alert.alert("Error", "Failed to cancel reservation.");
    }
  };

  // ================== UI ==================
  if (loading)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );

  if (!book)
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text>No book found.</Text>
      </View>
    );

  const inactiveStatuses = ["cancelled", "returned", "expired", "completed", "declined"];
  const isActiveReservation = reservation && !inactiveStatuses.includes(reservation.status);
  const status = isActiveReservation
    ? reservation.status === "approved"
      ? "Borrowed"
      : "Reserved"
    : book?.availableCount > 0
    ? "Available"
    : "Not Available";

  const statusColor =
    status === "Available"
      ? "text-blue-500"
      : status === "Reserved"
      ? "text-yellow-600"
      : status === "Borrowed"
      ? "text-red-600"
      : "text-gray-500";

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ alignItems: "center", padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3365a2"]} />}
      >
        {book?.picture ? (
          <Image
            source={{ uri: book.picture }}
            style={{ width: 180, height: 260, borderRadius: 16, marginTop: 50, marginBottom: 4 }}
          />
        ) : (
          <View style={{ width: 180, height: 260, marginTop: 50, marginBottom: 4 }}>
            <Text>No Cover</Text>
          </View>
        )}

        <Text style={{ fontSize: 25, fontWeight: "500", marginBottom: 1 }}>{book.title}</Text>
        <Text className="text-lg text-center mb-5">Author(s): {book.author || "Unknown"}</Text>
        <Text className="text-lg text-center mb-1">
          Status: <Text className={statusColor}>{status}</Text>
        </Text>
        <Text className="text-lg text-center mb-1">Available: {book.availableCount ?? 0} copies</Text>
        <Text className="text-lg text-center mb-1">Reserved: {book.reservedCount ?? 0} copies</Text>
        <Text className="text-lg text-center mb-1">Borrowed: {book.borrowedCount ?? 0} copies</Text>
        <Text className="text-lg text-center mb-3">
          Category:{" "}
          {Array.isArray(book.category)
            ? book.category.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(", ")
            : book.category || "N/A"}
        </Text>

        {/* Countdown */}
        {reservation?.status === "reserved" && countdown && (
          <View className="bg-yellow-500 px-6 py-4 rounded-lg mt-2 mb-4">
            <Text className="text-white text-center font-semibold">Pickup within: {countdown}</Text>
          </View>
        )}
        {reservation?.status === "approved" && countdown && (
          <View className="bg-blue-500 px-6 py-4 rounded-lg mt-10 mb-4">
            <Text className="text-white text-center font-semibold">Return within: {countdown}</Text>
          </View>
        )}

        {/* Reserve Button */}
        {(!reservation || inactiveStatuses.includes(reservation.status)) && (
          <TouchableOpacity
            onPress={handleReserve}
            disabled={book.availableCount <= 0 || user?.status?.toLowerCase?.() !== "active"}
            className={`px-20 py-4 rounded-full mt-4 ${
              user?.status?.toLowerCase?.() !== "active"
                ? "bg-gray-400"
                : book.availableCount > 0
                ? "bg-blue-600"
                : "bg-gray-400"
            }`}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {user?.status?.toLowerCase?.() !== "active" ? "Awaiting Verification" : "Reserve"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button */}
        {reservation?.status === "reserved" && (
          <TouchableOpacity onPress={handleCancel} className="bg-red-500 px-6 py-4 rounded-lg mb-4">
            <Text className="text-white text-lg font-semibold text-center">Cancel Reservation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
