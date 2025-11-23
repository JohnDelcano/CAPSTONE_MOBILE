import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const ResetPasswordScreen = () => {
  // ⚡ Use useLocalSearchParams instead of useSearchParams
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE = "https://api-backend-urlr.onrender.com";

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/students/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to reset password");
      } else {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.replace("/signin"), 2000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <Text className="text-3xl mb-4 font-bold">Reset Password</Text>
      <Text className="text-center text-gray-500 mb-6">
        Enter your new password below.
      </Text>

      <TextInput
        placeholder="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        className="w-full max-w-md px-4 py-3 border-b-2 border-gray-400 mb-6 text-lg"
      />

      <Pressable
        onPress={handleResetPassword}
        disabled={loading}
        className="w-full max-w-md h-16 rounded-full items-center justify-center overflow-hidden shadow-lg"
      >
        <LinearGradient
          colors={["#43435E", "#55556a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute left-0 right-0 top-0 bottom-0 rounded-full"
        />
        <Text className="text-white text-lg font-bold z-10">
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </Pressable>

      {message ? (
        <Text className="text-center text-red-500 mt-4">{message}</Text>
      ) : null}
    </View>
  );
};

export default ResetPasswordScreen;
