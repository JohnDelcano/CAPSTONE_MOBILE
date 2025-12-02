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

  // Load notifications from AsyncStorage
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("notifications");
      if (saved) setNotifications(JSON.parse(saved));
    })();
  }, []);

  // Save notifications whenever they change
  useEffect(() => {
    AsyncStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif: Notification) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to socket events
  useEffect(() => {
    const setupSocket = async () => {
      const socket = await joinUserRoom();
      if (!socket) return;

      // 🔹 Reservation created by user
      socket.on("reservationCreated", (data: any) => {
        const bookTitle = data?.bookTitle || data?.book?.title || "Unknown Book";
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Reservation Made",
          message: `You reserved the book "${bookTitle}".`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      // 🔹 Reservation approved by admin
      socket.on("reservationApproved", (data: any) => {
        const bookTitle = data?.bookTitle || data?.book?.title || "Unknown Book";
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Reservation Approved",
          message: `Your reservation for "${bookTitle}" was approved.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      // 🔹 Reservation cancelled by admin
      socket.on("reservationCancelled", (data: any) => {
        const bookTitle = data?.bookTitle || data?.book?.title || "Unknown Book";
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Reservation Cancelled",
          message: `Your reservation for "${bookTitle}" was cancelled.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      // 🔹 Book returned
      socket.on("bookReturned", (data: any) => {
        const bookTitle = data?.Title || data?.book?.title || "Unknown Book";
        addNotification({
          id: `${Date.now()}-${Math.random()}`,
          title: "Book Returned",
          message: `The book "${bookTitle}" has been returned.`,
          date: new Date().toLocaleString(),
          read: false,
        });
      });

      return () => {
        socket.off("reservationCreated");
        socket.off("reservationApproved");
        socket.off("reservationCancelled");
        socket.off("bookReturned");
      };
    };

    setupSocket();
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
