// components/Header.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useBooks } from "../Context/BooksContext";
import { useNotifications } from "../Context/NotificationContext";
import { Book } from "../Context/Types";

export default function Header() {
  const router = useRouter();
  const { books } = useBooks();
  const { unreadCount } = useNotifications(); // 👈 this will now re-render properly
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text) return setFilteredBooks([]);

    const results = books.filter((book) =>
      book.title?.toLowerCase().includes(text.toLowerCase()) ||
      book.author?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredBooks(results);
  };

  const handleSelectBook = (book: Book) => {
    setModalVisible(false);
    setSearchQuery("");
    router.push(`/book/${book._id}` as any);
  };

  return (
    <View
      style={{
        backgroundColor: "#f0f0f0",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 50,
          paddingBottom: 10,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../Tools/Logo/logo.png")}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#000" }}>
            LIBROSYNC
          </Text>
        </View>

        {/* Search + Notifications */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={require("../Tools/Logo/search.png")}
              style={{ width: 28, height: 28, marginRight: 16 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => router.push("/Notification")}
            style={{ position: "relative" }}
          >
            <Image
              source={require("../Tools/Logo/bell.png")}
              style={{ width: 28, height: 28 }}
            />

            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: "red",
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal for search */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", padding: 20 }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              padding: 16,
              flex: 1,
            }}
          >
            <TextInput
              autoFocus
              placeholder="Search by title or author..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              style={{
                height: 40,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            />
            <FlatList
              data={filteredBooks}
              keyExtractor={(item) => item._id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectBook(item)}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.title}</Text>
                  <Text style={{ fontSize: 14, color: "#555" }}>{item.author}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
