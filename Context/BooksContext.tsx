import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Book } from "./Types";

const API_BASE = process.env.API_BASE || "https://api-backend-urlr.onrender.com";
const GUEST_FAV_KEY = "guestFavorites";

async function readGuestFavorites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface BooksContextType {
  books: Book[];
  favorites: string[];
  toggleFavorite: (id: string) => Promise<void>;
  setFavorites: (ids: string[]) => void;
  fetchBooks: () => Promise<void>;
  updateBookAvailability: (bookId: string, isAvailable: boolean) => void;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export const useBooks = () => {
  const context = useContext(BooksContext);
  if (!context) throw new Error("useBooks must be inside BooksProvider");
  return context;
};

export const mergeGuestFavoritesToServer = async (studentId: string, token: string) => {
  try {
    const raw = await AsyncStorage.getItem(GUEST_FAV_KEY);
    if (!raw) return;
    const guestFavs: string[] = JSON.parse(raw);
    if (guestFavs.length === 0) return;

    console.log("🧩 Merging guest favorites:", guestFavs);

    await fetch(`${API_BASE}/api/students/${studentId}/favorites/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ favorites: guestFavs }),
    });

    await AsyncStorage.removeItem(GUEST_FAV_KEY);
    console.log("✅ Guest favorites successfully merged to server.");
  } catch (err) {
    console.error("❌ Error merging guest favorites:", err);
  }
};

export const BooksProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/books`);
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.books || data.data || [];
      setBooks(list);
    } catch (e) {
      console.warn("Error fetching books", e);
    }
  }, []);

  const updateBookAvailability = useCallback((bookId: string, isAvailable: boolean) => {
    setBooks((prev) =>
      prev.map((b) => (b._id === bookId ? { ...b, isAvailable } : b))
    );
  }, []);

  // 🧩 Load Books + Favorites on startup
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await fetchBooks();

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          const guest = await readGuestFavorites();
          if (mounted) setFavorites(guest);
          return;
        }

        const meRes = await fetch(`${API_BASE}/api/students/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meJson = await meRes.json();
        const id = meJson?.student?._id ?? meJson?._id;
        if (!id) return;

        // 🧩 Merge any guest favorites if found
        await mergeGuestFavoritesToServer(id, token);

        const favRes = await fetch(`${API_BASE}/api/students/${id}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const favJson = await favRes.json();
        const favs = Array.isArray(favJson.favorites)
          ? favJson.favorites
          : Array.isArray(favJson)
          ? favJson
          : favJson?.favorites ?? [];

        if (mounted) setFavorites(favs.map((b: any) => b?._id ?? String(b)));
      } catch (e) {
        console.warn("Error loading favorites", e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [fetchBooks]);

  // ❤️ Toggle favorite and sync with server
  const toggleFavorite = async (bookId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      // Optimistic update
      setFavorites((prev) =>
        prev.includes(bookId)
          ? prev.filter((id) => id !== bookId)
          : [...prev, bookId]
      );

      if (!token) {
        // Guest user — store locally
        const current = await readGuestFavorites();
        const updated = current.includes(bookId)
          ? current.filter((id) => id !== bookId)
          : [...current, bookId];
        await AsyncStorage.setItem(GUEST_FAV_KEY, JSON.stringify(updated));
        return;
      }

      // Logged in — update backend
      await fetch(`${API_BASE}/api/students/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId }),
      });
    } catch (error) {
      console.error("❌ Error toggling favorite:", error);
    }
  };

  return (
    <BooksContext.Provider
      value={{
        books,
        favorites,
        toggleFavorite,
        setFavorites,
        fetchBooks,
        updateBookAvailability,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
};
