import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { io } from "socket.io-client";
import { useBooks } from "../../Context/BooksContext";
import { Book } from "../../Context/Types";

const API_BASE = process.env.API_BASE || "https://api-backend-urlr.onrender.com";
const SOCKET_URL = API_BASE;

const favoriteImg = require("../../Tools/Logo/heart.png");
const favoritedImg = require("../../Tools/Logo/favorited.png");
const favoriteWhiteImg = require("../../Tools/Logo/like.png");

const Home = () => {
  const { books, favorites, toggleFavorite, fetchBooks } = useBooks();
  const [apiRecommended, setApiRecommended] = useState<Book[] | null>(null);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [recommendError, setRecommendError] = useState(false);

  // ---------------- Fetch Reservations ----------------
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

  // ---------------- Load Recommendations ----------------
  const loadRecommended = useCallback(
    async (manualRetry = false) => {
      if (loadingRecommended && !manualRetry) return;
      setLoadingRecommended(true);
      setRecommendError(false);

      try {
        const token = await AsyncStorage.getItem("token");
        let recommendedBooks: Book[] = [];

        // 🧩 Guest user (no token)
        if (!token) {
          const res = await fetch(`${API_BASE}/api/books/recommended`);
          if (res.ok) {
            const json = await res.json();
            recommendedBooks = Array.isArray(json)
              ? json
              : Array.isArray(json.data)
              ? json.data
              : [];
          }
          setApiRecommended(recommendedBooks.slice(0, 10));
          return;
        }

        // 🧩 Logged-in user: Fetch personalized recs
        const meRes = await fetch(`${API_BASE}/api/students/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error("User not found");

        const meJson = await meRes.json();
        const categories: string[] =
          meJson?.student?.category ?? meJson?.category ?? [];

        if (!categories.length) {
          const res = await fetch(`${API_BASE}/api/books/recommended`);
          if (res.ok) {
            const json = await res.json();
            recommendedBooks = Array.isArray(json)
              ? json
              : Array.isArray(json.data)
              ? json.data
              : [];
          }
          setApiRecommended(recommendedBooks.slice(0, 10));
          return;
        }

        // Fetch category-based recs
        const categoryResults = await Promise.all(
          categories.map(async (g) => {
            try {
              const res = await fetch(
                `${API_BASE}/api/books/category/${encodeURIComponent(g)}`
              );
              if (res.ok) {
                const json = await res.json();
                return Array.isArray(json)
                  ? json
                  : Array.isArray(json.data)
                  ? json.data
                  : [];
              }
              return [];
            } catch {
              return [];
            }
          })
        );

        const allBooks = categoryResults.flat();
        const uniqueBooks: Record<string, Book> = {};
        allBooks.forEach((book) => {
          if (book && book._id) uniqueBooks[book._id] = book;
        });

        const merged = Object.values(uniqueBooks).sort(
          (a, b) => (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0)
        );

        setApiRecommended(merged.slice(0, 10));
      } catch (err) {
        console.warn("❌ Error loading recommendations:", err);
        setRecommendError(true);
      } finally {
        setLoadingRecommended(false);
      }
    },
    [loadingRecommended]
  );

  // ---------------- Refresh Logic ----------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchBooks(), loadRecommended(true), fetchUserReservations()]);
    setRefreshing(false);
  }, [fetchBooks, loadRecommended, fetchUserReservations]);

  // ---------------- Initial Load ----------------
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    (async () => {
      await Promise.all([fetchBooks(), loadRecommended(), fetchUserReservations()]);
    })();
  }, [fetchBooks, loadRecommended, fetchUserReservations]);

  useFocusEffect(
    useCallback(() => {
      fetchBooks();
      fetchUserReservations();
    }, [fetchBooks, fetchUserReservations])
  );

  // ---------------- Socket.IO Real-time ----------------
  useEffect(() => {
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
  });

  const joinUserRoom = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      const res = await fetch(`${API_BASE}/api/students/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const studentId = json?.student?._id;
      if (studentId) {
        socket.emit("joinUser", studentId);
        console.log(`🧠 Joined room for student ${studentId}`);
      }
    }
  };

  socket.on("connect", () => {
    console.log("📡 Connected to Socket.IO server");
    joinUserRoom();
  });

  socket.on("reservationUpdated", async () => {
    console.log("🔄 Reservation update detected");
    await Promise.all([fetchBooks(), fetchUserReservations()]);
  });

  socket.on("bookStatusChanged", async () => {
    console.log("📚 Book status update detected");
    await fetchBooks();
  });

  socket.on("bookAdded", async () => {
    console.log("📗 New book added");
    await Promise.all([fetchBooks(), loadRecommended()]);
  });

  socket.on("bookDeleted", async () => {
    console.log("❌ Book deleted");
    await Promise.all([fetchBooks(), loadRecommended()]);
  });


  socket.on("reservationCreated", async () => {
    console.log("🆕 Reservation created");
    await Promise.all([fetchBooks(), fetchUserReservations()]);
  });

  socket.on("reservationCancelled", async () => {
    console.log("❌ Reservation cancelled");
    await Promise.all([fetchBooks(), fetchUserReservations()]);
  });

  socket.on("bookStatusUpdated", async () => {
    console.log("📚 Book status updated");
    await Promise.all([fetchBooks(), loadRecommended()]);
    Toast.show({
      type: "success",
      text1: "Book status updated",
      position: "bottom",
    });
  });


  // ✅ Return cleanup function (TypeScript accepts this)
  return () => {
    console.log("🧹 Disconnecting socket");
    socket.disconnect();
  };
}, [fetchBooks, fetchUserReservations, loadRecommended]);


  // ---------------- Favorite Button ----------------
  const FavoriteButton = ({
    bookId,
    size = 24,
    withBg = true,
    customImage,
  }: {
    bookId: string;
    size?: number;
    withBg?: boolean;
    customImage?: any;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const isFavorited = favorites.includes(bookId);

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
      toggleFavorite(bookId);
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className={`${withBg ? "bg-white/80 p-1 rounded-full" : ""}`}
      >
        <Animated.Image
          source={isFavorited ? favoritedImg : customImage ?? favoriteImg}
          style={{ width: size, height: size, transform: [{ scale }] }}
        />
      </TouchableOpacity>
    );
  };

  // ---------------- Render Book Items ----------------
  const reserveBook = (id: string) => router.push({ pathname: "/book/[id]", params: { id } });

  const renderBookItem = (item: Book) => {
    if (item.status?.toLowerCase() === "lost") return null;

    const inactiveStatuses = ["cancelled", "returned", "expired", "completed", "declined"];
    const myReservation = userReservations.find((r) => r.bookId?._id === item._id);

    let computedStatus = "Not Available";
    let colorStyle = { color: "#F87171" };

    if (myReservation && !inactiveStatuses.includes(myReservation.status)) {
      if (["approved", "borrowed"].includes(myReservation.status)) {
        computedStatus = "Borrowed";
        colorStyle = { color: "#16A34A" };
      } else if (myReservation.status === "reserved") {
        computedStatus = "Reserved";
        colorStyle = { color: "#F59E0B" };
      }
    } else if ((item.availableCount ?? 0) > 0) {
      computedStatus = "Available";
      colorStyle = { color: "#3B82F6" };
    }

    return (
      <TouchableOpacity
        className="flex-row bg-white p-4 mx-4 my-2 rounded-lg shadow-lg"
        onPress={() => reserveBook(item._id!)}
        activeOpacity={0.8}
      >
        {item.picture ? (
          <Image source={{ uri: item.picture }} className="w-[80px] h-[100px] rounded-md mr-4" />
        ) : (
          <View className="w-[80px] h-[100px] bg-gray-300 rounded-md mr-4 justify-center items-center">
            <Text className="text-gray-600 text-xs">No Cover</Text>
          </View>
        )}

        <View className="flex-1 justify-between">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <Text className="font-bold text-lg">{item.title ?? "Untitled"}</Text>
              <Text className="text-gray-600">Author: {item.author ?? "Unknown"}</Text>
              <View className="flex-row">
                <Text className="text-gray-500 text-sm">Status: </Text>
                <Text className="text-sm" style={colorStyle}>
                  {computedStatus}
                </Text>
              </View>
              {typeof item.availableCount === "number" && (
                <Text className="text-gray-500 text-sm">Available: {item.availableCount}</Text>
              )}
            </View>
            <FavoriteButton bookId={item._id!} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHorizontalBook = (item: Book) => {
    if (item.status?.toLowerCase() === "lost") return null;
    return (
      <TouchableOpacity
        className="w-40 m-2 bg-white rounded-xl shadow-lg p-2"
        onPress={() => reserveBook(item._id!)}
      >
        <View className="relative">
          {item.picture ? (
            <Image
              source={{ uri: item.picture }}
              className="w-full h-[140px] rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-36 bg-gray-300 rounded-lg items-center justify-center">
              <Text className="text-gray-600 text-xs">No Cover</Text>
            </View>
          )}
          <View className="absolute top-2 right-2 rounded-full bg-black/10">
            <FavoriteButton
              bookId={item._id!}
              size={22}
              withBg={false}
              customImage={favoriteWhiteImg}
            />
          </View>
        </View>
        <View className="mt-1">
          <Text className="font-bold text-base" numberOfLines={1}>
            {item.title ?? "Untitled"}
          </Text>
          <Text className="text-sm" numberOfLines={1}>
            {item.author ?? "Unknown"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ---------------- Header Section ----------------
  const ListHeader = () => (
    <View>
      <View className="flex flex-row justify-between items-center">
        <Text className="text-[20px] font-bold px-4 mt-2">Recommended for You</Text>
        <Text className="text-xl font-bold px-4 mt-2 mr-4">➡</Text>
      </View>

      {loadingRecommended ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#111" />
        </View>
      ) : recommendError ? (
        <View className="py-4 items-center">
          <Text className="text-gray-500 mb-2">Failed to load recommendations.</Text>
          <TouchableOpacity
            onPress={() => loadRecommended(true)}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={apiRecommended ?? books.slice(0, 10)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id ?? Math.random().toString()}
          renderItem={({ item }) => renderHorizontalBook(item)}
          contentContainerStyle={{ paddingLeft: 16, paddingVertical: 4 }}
        />
      )}

      <Text className="text-[20px] font-bold px-4 mt-6">All Books</Text>
    </View>
  );

  const filteredBooks = books.filter((b) => b.status?.toLowerCase() !== "lost");

  // ---------------- Render ----------------
  return (
    <View className="flex-1">
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item._id ?? Math.random().toString()}
        renderItem={({ item }) => renderBookItem(item)}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        extraData={favorites}
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

export default Home;
