import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const BACKEND_URL = "https://api-backend-urlr.onrender.com";


if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Student = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  phone?: string;
  address?: string;
  grade?: string;
  schoolname?: string;
  guardianname?: string;
  guardian?: string;
  gender?: string;
};

const Profile = () => {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<
    "view" | "email" | "password" | "help" | "about" | null
  >(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrRef, setQrRef] = useState<any>(null); 
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const toggleSection = (section: typeof expandedSection) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Error", "No token found. Please login again.");
          router.replace("/");
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/students/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (data.success) {
          setUser(data.student);
          setEditData(data.student);
        } else {
          Alert.alert("Error", data.message || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        Alert.alert("Error", "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/students/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Success", "Profile updated successfully");
        setUser(data.student);
        setEditModalVisible(false);
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleChangeEmail = async () => {
  if (!oldEmail.trim() || !newEmail.trim()) {
    return Alert.alert("Error", "Enter both old and new email addresses");
  }
  try {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${BACKEND_URL}/api/students/me/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldEmail, newEmail }), // ✅ now backend expects this
    });

    const data = await res.json();
    if (data.success) {
      Alert.alert("Success", "Email updated successfully");
      setUser(data.student);
      setOldEmail("");
      setNewEmail("");
      setExpandedSection(null);
    } else {
      Alert.alert("Error", data.message || "Failed to update email");
    }
  } catch (err) {
    console.error("Email change error:", err);
    Alert.alert("Error", "Failed to change email");
  }
};



  const handleChangePassword = async () => {
  if (!oldPassword.trim() || !newPassword.trim()) {
    return Alert.alert("Error", "Enter both old and new passwords");
  }
  try {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${BACKEND_URL}/api/students/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await res.json();
    if (data.success) {
      Alert.alert("Success", "Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setExpandedSection(null);
    } else {
      Alert.alert("Error", data.message || "Failed to update password");
    }
  } catch (err) {
    console.error("Password change error:", err);
    Alert.alert("Error", "Failed to change password");
  }
};


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">No user data found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <LinearGradient
        colors={["#343445", "#616181"]}
        className="items-center justify-center py-12 rounded-b-3xl shadow-md mt-6"
      >
        <Image
          source={
            user.profilePicture
              ? { uri: user.profilePicture }
              : require("../../assets/images/icon.png")
          }
          className="w-28 h-28 rounded-full border-4 border-white mb-3"
        />
        <Text className="text-blue-100 text-sm mb-1">
          ID: {user.studentId}
        </Text>

        <Text className="text-white font-bold text-2xl">
          {user.firstName} {user.lastName}
        </Text>
        {/* <TouchableOpacity
          onPress={() => setQrModalVisible(true)}
          className="bg-white/20 px-4 py-2 mt-3 rounded-lg"
        >
          <Text className="text-white font-semibold">View QR Code</Text>
        </TouchableOpacity> */}
      </LinearGradient>

      <View className="px-6 py-8">
        {/* ===== View Profile ===== */}
        <TouchableOpacity
          onPress={() => toggleSection("view")}
          className="bg-gray-100 py-4 px-5 rounded-2xl mb-3 shadow-sm"
        >
          <Text className="text-gray-800 text-base">View Profile</Text>
        </TouchableOpacity>

        {expandedSection === "view" && (
          <View className="bg-gray-50 p-4 rounded-2xl mb-4">
            {(
              [
                ["Student ID", user.studentId],
                ["Full Name", `${user.firstName} ${user.lastName}`],
                ["Email", user.email],
                ["Phone", user.phone],
                ["Address", user.address],
                ["Grade", user.grade],
                ["School", user.schoolname],
                ["Guardian", user.guardianname],
                ["Guardian Phone", user.guardian],
                ["Gender", user.gender],
              ] as [string, string | undefined][]
            ).map(([label, value]) => (
              <View
                key={label}
                className="border-b border-gray-200 py-2 mb-1 flex-row justify-between"
              >
                <Text className="text-gray-700 font-semibold">{label}</Text>
                <Text className="text-gray-600 max-w-[50%] text-right">
                  {value || "N/A"}
                </Text>
              </View>
            ))}

            <LinearGradient
              colors={["#43435E", "#55556a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-lg mt-4"
            >
              <TouchableOpacity
                className="p-3 rounded-lg"
                onPress={() => setEditModalVisible(true)}
              >
                <Text className="text-white text-center font-semibold">Edit</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ===== Change Email ===== */}
        <TouchableOpacity
          onPress={() => toggleSection("email")}
          className="bg-gray-100 py-4 px-5 rounded-2xl mb-3 shadow-sm"
        >
          <Text className="text-gray-800 text-base">Change Email</Text>
        </TouchableOpacity>

        {expandedSection === "email" && (
          <View className="bg-gray-50 p-4 rounded-2xl mb-4">
            <TextInput
              value={oldEmail}
              onChangeText={setOldEmail}
              placeholder="Current Email Address"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-2 mb-3"
            />
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New Email Address"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg p-2 mb-3"
            />
            <LinearGradient
              colors={["#43435E", "#55556a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-lg"
            >
              <TouchableOpacity
                className="p-3 rounded-lg"
                onPress={handleChangeEmail}
              >
                <Text className="text-white text-center font-semibold">
                  Update Email
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ===== Change Password ===== */}
        <TouchableOpacity
          onPress={() => toggleSection("password")}
          className="bg-gray-100 py-4 px-5 rounded-2xl mb-3 shadow-sm"
        >
          <Text className="text-gray-800 text-base">Change Password</Text>
        </TouchableOpacity>

        {expandedSection === "password" && (
          <View className="bg-gray-50 p-4 rounded-2xl mb-4">
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Current Password"
              secureTextEntry
              className="border border-gray-300 rounded-lg p-2 mb-3"
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              secureTextEntry
              className="border border-gray-300 rounded-lg p-2 mb-3"
            />
            <LinearGradient
              colors={["#43435E", "#55556a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-lg"
            >
              <TouchableOpacity
                className="p-3 rounded-lg"
                onPress={handleChangePassword}
              >
                <Text className="text-white text-center font-semibold">
                  Update Password
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ===== Help ===== */}
<TouchableOpacity
  onPress={() => toggleSection("help")}
  className="bg-gray-100 py-4 px-5 rounded-2xl mb-3 shadow-sm"
>
  <Text className="text-gray-800 text-base">Help</Text>
</TouchableOpacity>

{expandedSection === "help" && (
  <View className="bg-gray-50 p-4 rounded-2xl mb-4">
    <Text className="text-gray-600 mb-2">
      Welcome to the librosync application! Follow these steps to use the app:
    </Text>
    <Text className="text-gray-600 mb-1">
      1. <Text className="font-semibold">Register an account</Text> and login. Your account must be verified by the admin before you can reserve books.
    </Text>
    <Text className="text-gray-600 mb-1">
      2. <Text className="font-semibold">Reserve a book</Text> through the app. You must pick it up within 2 hours and bring a valid ID to the library.
    </Text>
    <Text className="text-gray-600 mb-1">
      3. Once the admin approves your reservation, <Text className="font-semibold">borrowed books must be returned by the given due date</Text>.
    </Text>
    <Text className="text-gray-600 mt-2">
      Make sure to follow these steps to avoid any issues with your reservations.
    </Text>
  </View>
)}


        {/* ===== About ===== */}
        <TouchableOpacity
          onPress={() => toggleSection("about")}
          className="bg-gray-100 py-4 px-5 rounded-2xl mb-3 shadow-sm"
        >
          <Text className="text-gray-800 text-base">About</Text>
        </TouchableOpacity>

        {expandedSection === "about" && (
          <View className="bg-gray-50 p-4 rounded-2xl mb-4">
            <Text className="text-center">MISSION</Text>
            <Text className="text-gray-600 text-center">
              Pangunahin sa aming adhikain ay ang mapaigting pa ang interes ng mga bata sa pagbabasa dahil iba pa rin ang naibibigay na kasiyahan ng pagbabasa. Nais din naming makatulong na mapalawak ang kaalaman at karunungan ng mga bata.
            </Text>
            <Text className="mt-6 text-center">VISION</Text>
            <Text className="text-gray-600 text-center">
              Ang magkaroon ng mga mamamayan na sagana sa karunungan upang makapaghahatid ng masaganang pamumuhay sa bawat pamilya at makadaragdag sa kaunlaran ng ating bayan.
            </Text>
          </View>
        )}

        {/* ===== Logout ===== */}
        <TouchableOpacity
          className="bg-red-400 py-4 px-5 rounded-2xl mt-10"
          onPress={async () => {
            await AsyncStorage.removeItem("token");
            router.replace("/");
          }}
        >
          <Text className="text-white font-semibold text-center">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Edit Modal ===== */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <ScrollView className="bg-white p-6 rounded-2xl w-[85%] max-h-[73%] shadow-lg" contentContainerStyle={{ paddingBottom: 40 }}>
  <Text className="text-xl font-bold mb-4 text-center text-blue-600">
    Edit Profile
  </Text>

  {(
    [
      "firstName",
      "lastName",
      "phone",
      "address",
      "grade",
      "schoolname",
      "guardianname",
      "guardian",
      "gender",
    ] as (keyof Student)[]
  ).map((field) => (
    <View key={field} className="mb-3">
      {/* Title / Label */}
      <Text className="text-gray-700 font-semibold mb-1">
        {field.replace(/^\w/, (c) => c.toUpperCase())}
      </Text>

      {/* Input */}
      <TextInput
        value={editData[field] || ""}
        onChangeText={(text) =>
          setEditData({ ...editData, [field]: text })
        }
        placeholder={`Enter ${field.replace(/^\w/, (c) => c.toUpperCase())}`}
        className="border border-gray-300 rounded-lg p-2"
      />
    </View>
  ))}

  <LinearGradient
    colors={["#43435E", "#55556a"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="rounded-lg mt-3"
  >
    <TouchableOpacity
      className="p-3 rounded-lg"
      onPress={handleSaveProfile}
    >
      <Text className="text-white text-center font-semibold">
        Save Changes
      </Text>
    </TouchableOpacity>
  </LinearGradient>

  <TouchableOpacity
    className="mt-5"
    onPress={() => setEditModalVisible(false)}
  >
    <Text className="text-center text-gray-500">Cancel</Text>
  </TouchableOpacity>
</ScrollView>

        </View>
      </Modal>

 {/* ===== QR Code Modal ===== */}
<Modal visible={qrModalVisible} animationType="fade" transparent>
  <View className="flex-1 justify-center items-center bg-black/70">
    <View className="bg-white p-6 rounded-2xl items-center w-[85%] shadow-lg">
      <Text className="text-lg font-bold mb-4 text-gray-800">
        {user.firstName} {user.lastName}&apos;s QR Code
      </Text>

      <View className="bg-white p-4 rounded-lg mb-5">
        <QRCode
          value={user.studentId}
          size={220}
          getRef={(ref) => setQrRef(ref)}
        />
      </View>

      {/* ✅ Fixed Save QR Code logic for Expo SDK 50+ */}
      {/* ✅ Fixed Save QR Code logic for Expo SDK 50+ */}
<TouchableOpacity
  onPress={async () => {
    try {
  if (Platform.OS === "android") {
    console.log("Expo Go detected — skipping MediaLibrary permission check");
  } else {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to save QR code");
      return;
    }
  }

  if (qrRef) {
    qrRef.toDataURL(async (data: string) => {
      const directory =
        (FileSystem as any).cacheDirectory ??
        (FileSystem as any).documentDirectory ??
        "";

      const filename = `${directory}${user.studentId}_QR.png`;

      await FileSystem.writeAsStringAsync(filename, data, { encoding: "base64" });

      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert("Saved!", "QR Code has been saved to your gallery.");
    });
  }
} catch (err: any) {
  console.error("Save QR error:", err);
  Alert.alert("Error", "Failed to save QR code: " + err.message);
}

  }}
  className="bg-blue-600 px-5 py-3 rounded-lg mb-3"
>
  <Text className="text-white font-semibold">Save QR Code</Text>
</TouchableOpacity>



      <TouchableOpacity onPress={() => setQrModalVisible(false)}>
        <Text className="text-gray-500 mt-2">Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </ScrollView>
  );
};

export default Profile;
