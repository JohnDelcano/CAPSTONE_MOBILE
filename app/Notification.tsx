import { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useNotifications } from "../Context/NotificationContext";

export default function NotificationScreen() {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);

    // Simulate a fetch for new notifications or any action you want to perform when refreshing
    setTimeout(() => {
      // Once the refresh is done, stop the refreshing animation
      setRefreshing(false);
    }, 1000); // Simulate a delay (you can replace this with actual fetching logic)
  };

  useEffect(() => {
    // This ensures the user room is joined once the screen is mounted.
    // You can add socket events if needed here, but this is handled in NotificationContext now.
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>

      {/* Notification Count */}
      {unreadCount > 0 && (
        <Text style={{ textAlign: "center", color: "red" }}>
          You have {unreadCount} unread notifications!
        </Text>
      )}

      {/* Render notifications */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              marginVertical: 6,
              borderRadius: 8,
              backgroundColor: item.read ? "#eee" : "#fff",
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {item.title}
            </Text>
            <Text style={{ color: "#444", marginTop: 4 }}>{item.message}</Text>
            <Text style={{ fontSize: 12, color: "gray", marginTop: 6 }}>
              {item.date}
            </Text>

            {!item.read && (
              <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                style={{
                  marginTop: 8,
                  paddingVertical: 5,
                  backgroundColor: "#4CAF50",
                  borderRadius: 5,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff" }}>Mark as Read</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 50, color: "#888" }}>
            No notifications yet.
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]} // You can customize the color of the refresh spinner
            tintColor="#4CAF50" // Optional: sets the spinner color on iOS
          />
        }
      />
    </View>
  );
}
