// src/Context/ReservationContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket, joinUserRoom } from "../src/api/socket";
import { useBooks } from "./BooksContext";
// ---------------------- Types ----------------------
interface Book {
  _id: string;
  title: string;
  isAvailable: boolean;
}

interface Reservation {
  _id: string;
  studentId?: string;
  bookId?: Book;
  status:
    | "pending"
    | "reserved"
    | "approved"
    | "borrowed"
    | "returned"
    | "cancelled";
}

interface ReservationContextType {
  reservations: Reservation[];
  fetchReservations: () => Promise<void>;
  reserveBook: (bookId: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  socket: Socket | null;
}

// ---------------------- Setup ----------------------
const ReservationContext = createContext<ReservationContextType>({
  reservations: [],
  fetchReservations: async () => {},
  reserveBook: async () => {},
  cancelReservation: async () => {},
  socket: null,
});

const API_URL = "https://api-backend-urlr.onrender.com";

// ---------------------- Provider ----------------------
export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { updateBookAvailability } = useBooks();

  // 📦 Fetch user reservations
  const fetchReservations = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/reservation/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.reservations || res.data;
      if (Array.isArray(data)) setReservations(data);
    } catch (err) {
      console.error("❌ Fetch reservations error:", err);
    }
  }, []);

  // 🟢 Reserve a book
  const reserveBook = useCallback(
    async (bookId: string) => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.post(
          `${API_URL}/api/reservation/${bookId}`,
          { bookId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newReservation = res.data;
        setReservations((prev) => [newReservation, ...prev]);
        updateBookAvailability(bookId, false);

      } catch (err) {
        console.error("❌ Reserve error:", err);
      }
    },
    [ updateBookAvailability]
  );

  // ❌ Cancel reservation
  const cancelReservation = useCallback(
    async (reservationId: string) => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        await axios.put(
          `${API_URL}/api/reservation/${reservationId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setReservations((prev) =>
          prev.map((r) =>
            r._id === reservationId ? { ...r, status: "cancelled" } : r
          )
        );

        const cancelled = reservations.find((r) => r._id === reservationId);
        if (cancelled?.bookId?._id)
          updateBookAvailability(cancelled.bookId._id, true);
      } catch (err) {
        console.error("❌ Cancel error:", err);
      }
    },
    [reservations, updateBookAvailability]
  );

  // 🌐 Setup Socket.IO
  useEffect(() => {
  let mounted = true;
  const setup = async () => {
    const sock = await joinUserRoom();
    if (!sock) return;

    // keep reference
    if (mounted) setSocket(sock);

    sock.on("connect", () => console.log("✅ Reservation socket connected"));
    sock.on("disconnect", () => console.log("❌ Reservation socket disconnected"));

    sock.on("reservationUpdated", (updated: Reservation) => {
      setReservations((prev) =>
        prev.some((r) => r._id === updated._id)
          ? prev.map((r) => (r._id === updated._id ? updated : r))
          : [updated, ...prev]
      );
    });

    sock.on("reservationCreated", (newRes: Reservation) => {
      setReservations((prev) => (prev.some((r) => r._id === newRes._id) ? prev : [newRes, ...prev]));
    });

    // ensure initial fetch
    await fetchReservations();
  };

  setup();

  return () => {
    mounted = false;
    const s = getSocket();
    // keep socket alive globally; only remove handlers if needed
    if (s) {
      s.off("reservationUpdated");
      s.off("reservationCreated");
    }
  };
}, [fetchReservations]);

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        fetchReservations,
        reserveBook,
        cancelReservation,
        socket,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

// 🪄 Custom Hook
export const useReservations = () => useContext(ReservationContext);
