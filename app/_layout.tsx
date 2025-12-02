// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BooksProvider } from "../Context/BooksContext";
import { NotificationProvider } from "../Context/NotificationContext"; // ✅ Add this import
import { ReservationProvider } from "../Context/ReservationContext";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BooksProvider>
        <ReservationProvider>
          <NotificationProvider>
            <Stack>
              <Stack.Screen
                name="index"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="signin" options={{ title: "",  }} />
              <Stack.Screen name="signup" options={{ title: "", headerShown: false }} />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
          
            </Stack>
          </NotificationProvider>
        </ReservationProvider>
      </BooksProvider>
    </SafeAreaProvider>
  );
}
