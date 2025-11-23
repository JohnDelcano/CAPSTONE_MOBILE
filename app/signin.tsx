import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mergeGuestFavoritesToServer } from "../Context/BooksContext";

const API_BASE = "https://api-backend-urlr.onrender.com";

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  interface LoginResponse {
    token: string;
    student: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }

  // ✅ Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("rememberedEmail");
        const savedPassword = await AsyncStorage.getItem("rememberedPassword");
        const rememberFlag = await AsyncStorage.getItem("rememberMe");

        if (rememberFlag === "true" && savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (err) {
        console.warn("Error loading saved credentials:", err);
      }
    };
    loadSavedCredentials();
  }, []);

  // ✅ Save or clear credentials when checkbox toggles
  const handleRememberMeToggle = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);

    if (!newValue) {
      await AsyncStorage.multiRemove([
        "rememberedEmail",
        "rememberedPassword",
        "rememberMe",
      ]);
    }
  };

  async function handleLoginSuccess(data: LoginResponse) {
    try {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("student", JSON.stringify(data.student));

      // ✅ Merge favorites
      await mergeGuestFavoritesToServer(data.student._id, data.token);

      // ✅ Save credentials if "Remember Me" is checked
      if (rememberMe) {
        await AsyncStorage.setItem("rememberedEmail", email);
        await AsyncStorage.setItem("rememberedPassword", password);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        await AsyncStorage.multiRemove([
          "rememberedEmail",
          "rememberedPassword",
          "rememberMe",
        ]);
      }

      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("Error saving login info:", err);
    }
  }

  const handleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/students/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleLoginSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 w-full">
        {/* Header */}
        <View className="ml-[10px] flex-row items-center">
          <Text className="text-4xl text-left">Hello there</Text>
          <Image
            source={require("../Tools/Logo/wave.png")}
            className="w-6 h-6 ml-3"
            resizeMode="contain"
          />
        </View>
        <View className="ml-[11px]">
          <Text className="text-[20px] text-gray-500">
            Please enter your email and password to{"\n"}sign in
          </Text>
        </View>

        {/* Form */}
        <View className="flex-1 justify-center items-center">
          <View className="w-full max-w-[360px]">
            <Text className="text-[17px]">Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#888"
              className="text-lg px-2 pb-2 border-b-2 border-black-500 mb-6"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text className="text-[17px]">Password</Text>
            <View className="flex-row items-center border-b-2 border-black-500">
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#888"
                className="flex-1 text-lg px-2 pb-2 bg-transparent"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-1"
              >
                <Image
                  source={
                    showPassword
                      ? require("../Tools/Logo/view.png")
                      : require("../Tools/Logo/hide.png")
                  }
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* ✅ Remember Me */}
            <View className="flex-row items-center justify-between mt-2 mb-8">
              <Pressable
                onPress={handleRememberMeToggle}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border mr-2 ${
                    rememberMe
                      ? "bg-[#43435E] border-[#43435E]"
                      : "bg-white border-gray-400"
                  }`}
                />
                <Text className="text-gray-700 text-lg">Remember me</Text>
              </Pressable>
              
<Link href="/ForgotPasswordScreen" asChild>
  <Pressable>
    <Text className="text-[#43435E] text-lg font-medium underline">
      Forgot password?
    </Text>
  </Pressable>
</Link>
            </View>
          </View>
        </View>

        {/* Sign-in button */}
        <View className="w-full max-w-[360px] mx-auto mb-10">
          <Pressable
            className="w-full h-16 rounded-full items-center justify-center shadow-xl overflow-hidden"
            onPress={handleSignIn}
            disabled={loading}
            style={{ elevation: 8 }}
          >
            <LinearGradient
              colors={["#43435E", "#55556a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute left-0 right-0 top-0 bottom-0 rounded-full"
            />
            <Text className="text-[18px] text-white font-bold z-10">
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </Pressable>

          {error ? (
            <Text className="text-red-500 text-center mt-2">{error}</Text>
          ) : null}

          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-500 text-lg mr-2">
              Don’t have an account?
            </Text>
            <Link href="./signup" asChild>
              <Text className="text-red-500 text-lg">Sign Up</Text>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Signin;
