import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Socket, io as socketIO } from "socket.io-client";
import { useBooks } from "../../Context/BooksContext";
import { Book } from "../../Context/Types";

const favoritedImg = require("../../Tools/Logo/favorited.png");

const API_BASE = process.env.API_BASE || "https://api-backend-urlr.onrender.com";

let socket: Socket | null = null;

type ReservationStatus =
  | "reserved"
  | "approved"
  | "borrowed"
  | "returned"
  | "cancelled"
  | "pending"; // ✅ Added optional status

interface Reservation {
  _id: string;
  bookId?: Book;
  status?: ReservationStatus;
}

const Favorite = () => {
  const { books, favorites, toggleFavorite, fetchBooks } = useBooks();
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Fetch user's reservations
  const fetchUserReservations = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/reservation/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      setUserReservations(data.reservations || []);
    } catch (err) {
      console.error("Error fetching user reservations:", err);
    }
  }, []);

  // ✅ Setup realtime socket
  useEffect(() => {
    socket = socketIO(API_BASE, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => console.log("✅ Connected to socket server"));
    socket.on("disconnect", () => console.log("❌ Disconnected from socket server"));

    socket.on("bookUpdated", async () => {
      console.log("📚 Book updated — refreshing favorites");
      await fetchBooks();
    });

    socket.on("reservationUpdated", async () => {
      console.log("📦 Reservation updated — refreshing reservations");
      await fetchUserReservations();
    });

    return () => {
      socket?.disconnect();
    };
  }, [fetchBooks, fetchUserReservations]);

  // ✅ Initial load
  useEffect(() => {
    (async () => {
      await Promise.all([fetchBooks(), fetchUserReservations()]);
    })();
  }, [fetchBooks, fetchUserReservations]);

  // ✅ Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBooks(), fetchUserReservations()]);
    setRefreshing(false);
  };

  // ✅ Filter favorites
  const favoriteBooks: (Book & { _id: string })[] = books.filter(
    (b): b is Book & { _id: string } =>
      typeof b._id === "string" && favorites.includes(b._id)
  );

  const goToBook = (id?: string) => {
    if (!id) return;
    router.push({ pathname: "/book/[id]", params: { id } });
  };

  // ✅ Render each favorite book
  const renderItem = ({ item }: { item: Book & { _id: string } }) => {
    let computedStatus = "Not Available";
    let colorClass = "text-red-600";

    const myReservation = userReservations.find(
      (r) => r.bookId?._id === item._id
    );

    if (myReservation && myReservation.status) {
      switch (myReservation.status) {
        case "approved":
        case "borrowed":
          computedStatus = "Borrowed";
          colorClass = "text-green-600";
          break;
        case "reserved":
        case "pending": // ✅ Included safely in type now
          computedStatus = "Reserved";
          colorClass = "text-yellow-600";
          break;
        case "returned":
        case "cancelled":
          computedStatus = "Available";
          colorClass = "text-blue-600";
          break;
        default:
          break;
      }
    } else if (
      (item.availableCount && item.availableCount > 0) ||
      (item.status && item.status.toLowerCase() === "available")
    ) {
      computedStatus = "Available";
      colorClass = "text-blue-600";
    }

    return (
      <TouchableOpacity
        onPress={() => goToBook(item._id)}
        activeOpacity={0.9}
        className="bg-white p-4 m-2 rounded-lg shadow"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row">
          {item.picture ? (
            <Image
              source={{ uri: item.picture }}
              className="w-[80px] h-[120px] rounded-md mr-4"
            />
          ) : (
            <View className="w-16 h-24 bg-gray-300 rounded-md mr-4 justify-center items-center">
              <Text className="text-gray-600 text-xs">No Cover</Text>
            </View>
          )}

          <View className="flex-1 justify-between">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="font-bold text-lg">
                  {item.title ?? "Untitled"}
                </Text>
                <Text className="text-gray-600">
                  Author(s): {item.author ?? "Unknown Author"}
                </Text>

                <View className="flex-row items-center mt-1">
                  <Text className="text-gray-600 text-sm">Status: </Text>
                  <Text className={` text-sm ${colorClass}`}>
                    {computedStatus}
                  </Text>
                </View>

                {typeof item.availableCount === "number" && (
                  <Text className="text-gray-500 text-sm mt-1">
                    Available: {item.availableCount}
                  </Text>
                )}

                {item.category && (
                  <Text
                    className="text-gray-500 text-sm mt-1"
                    numberOfLines={1}
                  >
                    Category:{" "}
                    {Array.isArray(item.category)
                      ? item.category
                          .map(
                            (c: string) =>
                              c
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(" ")
                          )
                          .join(", ")
                      : item.category
                          .split(" ")
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ")}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); 
                  toggleFavorite(item._id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
              >
                <Image
                  source={favoritedImg}
                  style={{ width: 26, height: 26 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!favoriteBooks.length)
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-gray-500">No favorites yet</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={favoriteBooks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
          />
        }
      />
    </View>
  );
};

export default Favorite;
