import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { joinUserRoom } from "../src/api/socket";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAllAsRead: () => {},
  markAsRead: () => {},
  unreadCount: 0,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔹 Load notifications from AsyncStorage
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("notifications");
      if (saved) setNotifications(JSON.parse(saved));
    })();
  }, []);

  // 🔹 Save to AsyncStorage whenever notifications change
  useEffect(() => {
    AsyncStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // 🔹 Add new notification
  const addNotification = (notif: Notification) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  // 🔹 Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );
  };

  // 🔹 Mark a specific notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 🔹 Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // 🔹 Listen to socket events
  useEffect(() => {
    const setupSocket = async () => {
      const socket = await joinUserRoom();
      if (!socket) return;

      socket.on("reservationApproved", (data: any) => {
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Reservation Approved",
          message: `Your reservation for "${data.bookTitle}" was approved.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      socket.on("reservationCancelled", (data: any) => {
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Reservation Cancelled",
          message: `Your reservation for "${data.bookTitle}" was cancelled.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      socket.on("bookReturned", (data: any) => {
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Book Returned",
          message: `The book "${data.Title}" has been returned.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      return () => {
        socket.off("reservationApproved");
        socket.off("reservationCancelled");
        socket.off("bookReturned");
      };
    };

    setupSocket();

    return () => {
      // Cleanup is done by the return inside `setupSocket` function
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAllAsRead, markAsRead, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
