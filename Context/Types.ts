// types.ts
export interface Book {
  _id?: string;
  book_id?: string;
  title?: string;
  author?: string;
  quantity?: number;
  quality?: string;
  picture?: string;
  available?: boolean;
  favoritesCount?: number;
  createdAt?: string;
  favorite?: boolean;
  reserved?: number; // ✅ add this
  borrowed?: number; // ✅ add this
  genre?: string | string[]; // ✅ fix for join error
  availableCount?: number;
  reservedCount?: number;
  borrowedCount?: number;
  status?: "Available" | "Reserved" | "Borrowed" | "Not Available" | "Lost";
  category?: string;
}

