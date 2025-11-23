import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useReservations } from "../../Context/ReservationContext";

const API_BASE = "https://api-backend-urlr.onrender.com";

const Borrowed = () => {
  const router = useRouter();
  const { reservations, fetchReservations, socket } = useReservations();

  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [reservedBooks, setReservedBooks] = useState<any[]>([]);
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🧩 Separate borrowed & reserved books
  const loadReservations = useCallback(() => {
    const activeReservations = reservations.filter(
      (r) =>
        !["returned", "cancelled", "declined", "completed"].includes(
          r.status?.toLowerCase()
        )
    );

    const borrowed = activeReservations.filter((r) =>
      ["approved", "borrowed"].includes(r.status?.toLowerCase())
    );

    const reserved = activeReservations.filter((r) =>
      ["reserved", "pending"].includes(r.status?.toLowerCase())
    );

    setBorrowedBooks(borrowed);
    setReservedBooks(reserved);
    setLoading(false);
  }, [reservations]);

  useEffect(() => {
    loadReservations();
  }, [reservations, loadReservations]);

  // ⏳ Countdown timer for due dates
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: { [key: string]: string } = {};
      borrowedBooks.forEach((r) => {
        if (r.dueDate) {
          const now = new Date();
          const due = new Date(r.dueDate);
          const diff = due.getTime() - now.getTime();

          if (diff <= 0) {
            newCountdowns[r._id] = "Expired";
          } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            newCountdowns[r._id] = `${days}d ${hours}h ${minutes}m`;
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [borrowedBooks]);

  // 🔁 Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  }, [fetchReservations]);

  // ⚡ SOCKET realtime listener
  useEffect(() => {
    if (!socket) return;

    console.log("✅ Borrowed screen socket listening");

    const handleReservationChange = async (updatedReservation: any) => {
      console.log("📡 reservationUpdated received:", updatedReservation);
      // just refresh the reservations list
      await fetchReservations();
    };

    const handleBookChange = async () => {
      console.log("📡 bookUpdated received");
      await fetchReservations();
    };

    // Listen to relevant events
    socket.on("reservationCreated", handleReservationChange);
    socket.on("reservationUpdated", handleReservationChange);
    socket.on("bookUpdated", handleBookChange);

    return () => {
      socket.off("reservationCreated", handleReservationChange);
      socket.off("reservationUpdated", handleReservationChange);
      socket.off("bookUpdated", handleBookChange);
    };
  }, [socket, fetchReservations]);

  // 🎴 Book Card Renderer
  const renderBookCard = (item: any, type: "borrowed" | "reserved") => {
    const pictureUrl = item.bookId?.picture
      ? item.bookId.picture.startsWith("http")
        ? item.bookId.picture
        : `${API_BASE}${item.bookId.picture}`
      : null;

    return (
      <TouchableOpacity
        key={item._id || item.bookId?._id}
        activeOpacity={0.8}
        className="flex-row bg-white mt-5 p-4 mx-4 mb-4 rounded-lg shadow-lg"
        onPress={() =>
          item.bookId?._id && router.push(`/book/${item.bookId._id}`)
        }
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {pictureUrl ? (
          <Image
            source={{ uri: pictureUrl }}
            className="w-20 h-28 rounded-md mr-4"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-28 bg-gray-300 rounded-md mr-4 justify-center items-center">
            <Text className="text-gray-600 text-xs text-center px-1">
              No Cover
            </Text>
          </View>
        )}

        <View className="flex-1 justify-between">
          <View>
            <Text className="font-bold text-lg" numberOfLines={1}>
              {item.bookId?.title || "Unknown Title"}
            </Text>
            <Text className="text-gray-600" numberOfLines={1}>
              {item.bookId?.author || "Unknown Author"}
            </Text>

            {type === "borrowed" && (
              <Text className="text-gray-600 mt-1 text-sm">
                Due in:{" "}
                <Text className="font-semibold text-blue-600">
                  {countdowns[item._id] || "Calculating..."}
                </Text>
              </Text>
            )}

            {type === "reserved" && (
              <Text className="text-yellow-600 mt-1 text-sm font-semibold">
                Waiting for approval...
              </Text>
            )}
          </View>

          <View className="flex flex-row gap-1">
            <Text>Status: </Text>
            <Text
              className={`font-semibold ${
                type === "borrowed" ? "text-green-600" : "text-yellow-500"
              }`}
            >
              {type === "borrowed" ? "Borrowed" : "Reserved"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 🕒 Loading screen
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-2 text-gray-500">Loading your books...</Text>
      </View>
    );
  }

  // 📚 Main layout
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2563eb"]}
        />
      }
    >
      <Text className="text-lg font-bold text-gray-800 px-4 mt-4">
        Reserved Books
      </Text>
      {reservedBooks.length > 0 ? (
        reservedBooks.map((item) => renderBookCard(item, "reserved"))
      ) : (
        <View className="items-center justify-center my-6">
          <Image
            source={require("../../Tools/Logo/books.png")}
            style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 6 }}
          />
          <Text className="text-gray-500 text-sm">No reserved books</Text>
        </View>
      )}

      <Text className="text-lg font-bold text-gray-800 px-4 mt-4">
        Borrowed Books
      </Text>
      {borrowedBooks.length > 0 ? (
        borrowedBooks.map((item) => renderBookCard(item, "borrowed"))
      ) : (
        <View className="items-center justify-center my-6">
          <Image
            source={require("../../Tools/Logo/books.png")}
            style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 6 }}
          />
          <Text className="text-gray-500 text-sm">No borrowed books</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Borrowed;
