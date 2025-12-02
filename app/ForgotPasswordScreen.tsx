import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
// ✅ Remove this line: import { API_BASE } from "../constants";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const API_BASE = "https://api-backend-urlr.onrender.com"; // keep this

  const handleSendReset = async () => {
  setLoading(true);
  setMessage("");

  try {
    const res = await fetch(`${API_BASE}/api/students/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Failed to generate reset token");
    } else {
      // 🔹 Navigate to ResetPasswordScreen with email + token
      router.push({
        pathname: "/ResetPasswordScreen",
        params: { email, token: data.token },
      });
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
      <Text className="text-3xl mb-4 font-bold">Forgot Password</Text>
      <Text className="text-center text-gray-500 mb-6">
        Enter your email to receive a password reset link.
      </Text>

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full max-w-md px-4 py-3 border-b-2 border-gray-400 mb-6 text-lg"
      />

      <Pressable
        onPress={handleSendReset}
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
          {loading ? "Sending..." : "Send Reset Link"}
        </Text>
      </Pressable>

      {message ? (
        <Text className="text-center text-red-500 mt-4">{message}</Text>
      ) : null}
    </View>
  );
};

export default ForgotPasswordScreen;
