import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import IDCamera from "./IDCamera";


WebBrowser.maybeCompleteAuthSession();

const Signup = () => {
  

  // Step state
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Gender & Category
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState<string[]>([]);
  const [genderStepError, setGenderStepError] = useState('');
  const [categoryStepError, setCategoryStepError] = useState('');

  // Profile info
  const [profile, setProfile] = useState({
    fname: '',
    lname: '',
    birthday: '',
    phone: '',
    address: '',
  });
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Image
  const [profileImage, setProfileImage] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileStepError, setProfileStepError] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [validPictures, setValidPictures] = useState<string[]>([]);


  // Account info
  const [account, setAccount] = useState({ email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmshowPassword, setConfirmShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  // const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Date picker
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Camera & modal state for ID capture
 const [showCamera, setShowCamera] = useState<number | false>(false);
  const phoneRef = useRef<TextInput>(null);
  const emergencyRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const firstRef = useRef<TextInput>(null);
  const lastRef = useRef<TextInput>(null);
  const gradeRef = useRef<TextInput>(null);
  const schoolRef = useRef<TextInput>(null);
  const emergencynameRef = useRef<TextInput>(null);
const [phoneError, setPhoneError] = useState(false);
const [emergencyPhoneError, setEmergencyPhoneError] = useState(false);
const [firstError, setFirstError] = useState(false);
const [lastError, setLastError] = useState(false);
const [addressError, setAddressError] = useState(false);
const [gradeError, setGradeError] = useState(false);
const [schoolError, setSchoolError] = useState(false);
const [emergencyNameError, setEmergencyNameError] = useState(false);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1); // go back one step
    } else {
      router.push("/signin"); // step 1 → Sign In
    }
  };

  const CATEGORY_LIST = [
  'Science',
  'Mathematics',
  'Literature',
  'History',
  'Technology',
  'Philosophy',
  'Engineering',
  'Computer Science',
  'Fiction',
  'Non-Fiction',
  'Programming',
  'Educational',
  'Ap',
  'English',
  'Tagalog',
];


  // // Google Auth
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId: '590815838035-ef7el8qvooqo1pqae95p9ci9evo26m5d.apps.googleusercontent.com',
  //   webClientId: '590815838035-ol1nb8a41g1rpq98obho9d9l05ip8fof.apps.googleusercontent.com',
  // });

  // useEffect(() => {
  //   if (response?.type === 'success') {
  //     const { authentication } = response;
  //     if (authentication?.accessToken) {
  //       fetchGoogleUser(authentication.accessToken);
  //     }
  //   }
  // }, [response]);

//   const fetchGoogleUser = async (accessToken: string) => {
//   try {
//     const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//     const user = await res.json();

//     // ✅ Define payload here
//     const payload = {
//       firstName: user.given_name,
//       lastName: user.family_name,
//       email: user.email,
//       profilePicture: user.picture,
//       gender: '',
//       category: [],
//     };

//     // ✅ Use payload and response correctly
//     const response = await fetch(
//       'https://api-backend-urlr.onrender.com/api/students/google',
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       }
//     );

//     const data = await response.json();

//     if (response.ok) {
//       // store token if provided by backend
//       if (data.token) await AsyncStorage.setItem('token', data.token);
//       if (data.student && data.student._id) await AsyncStorage.setItem('studentId', data.student._id);
//       // merge guest favorites to server for this account (if any)
//       try {
//         const sid = data.student && data.student._id ? data.student._id : await AsyncStorage.getItem('studentId');
//         const tokenToUse = data.token ?? await AsyncStorage.getItem('token');
//         if (sid && tokenToUse) {
//           const mod = await import('../Context/BooksContext');
//           if (mod && typeof mod.mergeGuestFavoritesToServer === 'function') {
//             await mod.mergeGuestFavoritesToServer(sid, tokenToUse);
//           }
//         }
//       } catch (e) {
//         console.warn('Error merging guest favorites after Google signup', e);
//       }
//       router.push('/home');
//     } else {
//       console.error('Backend error:', data);
//       setError('Google sign-in failed');
//     }
//   } catch (err) {
//     console.error(err);
//     setError('Google sign-in failed');
//   }
// };



const pickAndUploadProfileImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) return alert('Permission required!');

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (pickerResult.canceled) return;

  // show preview immediately
  setProfileImagePreview(pickerResult.assets[0].uri);

  try {
    setUploadingProfile(true);
    const data = new FormData();
    data.append('file', `data:image/jpeg;base64,${pickerResult.assets[0].base64}`);
    data.append('upload_preset', 'unsigned_preset');

    const res = await fetch('https://api.cloudinary.com/v1_1/dckhxhaws/image/upload', {
      method: 'POST',
      body: data,
    });

    const file = await res.json();
    if (file.secure_url) {
      setProfileImage(file.secure_url); // save uploaded URL
      setProfileImagePreview('');
    } else {
      alert('Image upload failed');
      setProfileImagePreview('');
    }
  } catch {
    alert('Image upload failed');
    setProfileImagePreview('');
  } finally {
    setUploadingProfile(false);
  }
};

  


  const checkPasswordStrength = (password: string) => {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const lengthValid = password.length >= 8;

  const typesCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  if (!lengthValid) return "Too short";
  if (typesCount === 1) return "Weak";
  if (typesCount === 2 || typesCount === 3) return 'Medium';
  if (typesCount === 4) return "Strong";
  return "Weak"; // default for 2 types
};


 const handleRegister = async () => {
  setLoading(true);
  setError("");

  // Basic validation
  if (
    !gender ||
    !profile.fname ||
    !profile.lname ||
    !profile.birthday ||
    !profile.phone ||
    !profile.address ||
    !account.email ||
    !account.password ||
    !confirmPassword ||
    !profileImage ||
    !grade ||
    !school ||
    !emergencyContactName ||
    !emergencyContactPhone ||
    validPictures.length < 2
  ) {
    setError("All fields are required!");
    setLoading(false);
    return;
  }

  if (account.password !== confirmPassword) {
    setError("Passwords do not match.");
    setLoading(false);
    return;
  }

   const strength = checkPasswordStrength(account.password);

  if (strength === "Weak" || strength === "Too short") {
    setError(
      strength === "Too short"
        ? "Password must be at least 8 characters."
        : "Password is too weak. Include a mix of uppercase, lowercase, numbers, and symbols."
    );
    return;
  }

  if (account.password !== confirmPassword) {
    setError("Passwords do not match.");
    return;
  }

  try {
    const payload = {
      firstName: profile.fname,
      lastName: profile.lname,
      email: account.email,
      password: account.password,
      birthday: profile.birthday,
      phone: profile.phone,
      address: profile.address,
      schoolname: school,
      guardianname: emergencyContactName,
      guardian: emergencyContactPhone,
      gender,
      category,
      grade,
      profilePicture: profileImage,
      validIDs: validPictures,
    };

    console.log("📦 Sending signup payload:", payload);

    const response = await fetch(
      "https://api-backend-urlr.onrender.com/api/students/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );


    const text = await response.text();
    console.log("📩 Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return valid JSON");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || "Registration failed");
    }

    if (data.student?._id) {
      await AsyncStorage.setItem("studentId", data.student._id);
      router.push("/signin");
    } else {
      throw new Error("Invalid response from server");
    }
  } catch (err) {
    console.error("❌ Signup error:", err);
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === "string") {
      setError(err);
    } else {
      setError("Network error");
    }
  } finally {
    setLoading(false); // ✅ Always stop loading, success or fail
  }
};



  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Custom Header */}
      <View className="flex-row items-center p-4 bg-white shadow">
        <TouchableOpacity onPress={handleBack} className="mr-4" activeOpacity={1}>
          <Ionicons name="arrow-back" size={28}/>
        </TouchableOpacity>
      </View>
      {/* STEP 1: Gender */}
      {/* Gender */}
{step === 1 && (
  <View className="flex-1 w-full justify-between">
    
    {/* Top */}
    <View>
      <View className="ml-[10px] flex-row items-center">
        <Text className="text-4xl text-left">What is your gender?</Text>
        <Image
          source={require('../Tools/Logo/equality.png')}
          className="w-8 h-8 ml-2"
          resizeMode="contain"
        />
      </View>
      <View className="ml-[11px] mb-10">
        <Text className="text-[20px] text-gray-500 text-left">
          Select gender for better content.
        </Text>
      </View>

      {/* Gender Options */}
      <View className="flex-column">
        {/* Male */}
        <Pressable
          onPress={() => {
            setGender('male');
            setGenderStepError('');
          }}
          className="flex-row items-center px-6 py-2"
        >
          <View
            className={`w-5 h-5 rounded-full border-2 mr-3 ${
              gender === 'male' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'
            }`}
          />
          <Text className="text-gray-700 text-[17px]">I am male</Text>
        </Pressable>

        <View className="w-full max-w-[360px] h-[1px] bg-gray-300 my-4 mx-auto" />

        {/* Female */}
        <Pressable
          onPress={() => {
            setGender('female');
            setGenderStepError('');
          }}
          className="flex-row items-center px-6 py-2"
        >
          <View
            className={`w-5 h-5 rounded-full border-2 mr-3 ${
              gender === 'female' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'
            }`}
          />
          <Text className="text-gray-700 text-[17px]">I am female</Text>
        </Pressable>

        <View className="w-full max-w-[360px] h-[1px] bg-gray-300 my-4 mx-auto" />

        {/* Undefined */}
        <Pressable
          onPress={() => {
            setGender('undefined');
            setGenderStepError('');
          }}
          className="flex-row items-center px-6 py-2"
        >
          <View
            className={`w-5 h-5 rounded-full border-2 mr-3 ${
              gender === 'undefined' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'
            }`}
          />
          <Text className="text-gray-700 text-[17px]">Rather not to say</Text>
        </Pressable>
      </View>
    </View>

    {/* Bottom */}
    <View className="w-full max-w-[360px] mx-auto mb-10">
      <View className="w-full h-[1px] bg-gray-300 my-4" />

      {/* Continue Button */}
      <Pressable
        className="w-full h-16 rounded-full items-center justify-center shadow-xl overflow-hidden"
        style={{ elevation: 8 }}
        onPress={() => {
          if (!gender) {
            setGenderStepError('Please select your gender.');
          } else {
            setGenderStepError('');
            setStep(2);
          }
        }}
      >
        <LinearGradient
          colors={["#43435E", "#55556a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute left-0 right-0 top-0 bottom-0 rounded-full"
        />
        <Text className="text-[18px] text-[#ffffff] font-bold z-10">Continue</Text>
      </Pressable>

      {/* Error Message */}
      {genderStepError && (
        <Text className="text-red-500 text-center mt-2">{genderStepError}</Text>
      )}

      {/* Sign In Link */}
      <View className="flex-row items-center justify-center mt-4">
        <Text className="text-gray-500 text-lg mr-2">Already have an account?</Text>
        <Link href="./signin" asChild>
          <Text className="text-red-500 text-lg">Sign In</Text>
        </Link>
      </View>
    </View>
  </View>
)}

{/* category Step */}
{step === 2 && (
  <View className="w-full flex-1 justify-between">

    {/* Scrollable Top Content */}
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View className="ml-[10px] flex-row items-center">
          <Text className="text-4xl">Choose the Book Category You Like</Text>
          <Image
            source={require('../Tools/Logo/books.png')}
            className="w-7 h-7 ml-2"
          />
        </View>

        <View className="pr-5 ml-[11px]">
          <Text className="text-[20px] text-gray-500">
            Select your preferred book category for better recommendations, or skip it.
          </Text>
        </View>

        {/* Categories */}
        <View className="flex-row flex-wrap mt-12 mb-10 mx-4">
          {CATEGORY_LIST.map(type => {
            const selected = category.includes(type);

            return (
              <Pressable
                key={type}
                onPress={() => {
                  setCategoryStepError('');
                  setCategory(selected
                    ? category.filter(t => t !== type)
                    : [...category, type]
                  );
                }}
                className={`px-5 py-2 m-1 rounded-full flex-row items-center ${
                  selected
                    ? 'bg-[#43435E] border-2 border-blue-400'
                    : 'bg-gray-200 border border-gray-300'
                }`}
              >
                <Text className={`${selected ? 'text-white' : 'text-gray-700'}`}>
                  {type}
                </Text>

                {selected && <Text className="text-white font-bold ml-2">×</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>

    {/* BOTTOM BUTTONS (NOW ALWAYS VISIBLE) */}
    <View className="w-full max-w-[360px] mx-auto mb-10">
      <View className="w-full h-[1px] bg-gray-300 my-4" />

      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 h-16 rounded-full items-center justify-center overflow-hidden"
          style={{ elevation: 8 }}
          onPress={() => setStep(3)}
        >
          <LinearGradient
            colors={['#43435E', '#55556a']}
            className="absolute inset-0 rounded-full"
          />
          <Text className="text-white font-bold text-[18px]">Skip</Text>
        </Pressable>

        <Pressable
          className="flex-1 h-16 rounded-full items-center justify-center overflow-hidden"
          style={{ elevation: 8 }}
          onPress={() => {
            if (!category.length) {
              setCategoryStepError('Please select at least one book category.');
            } else {
              setCategoryStepError('');
              setStep(3);
            }
          }}
        >
          <LinearGradient
            colors={['#43435E', '#55556a']}
            className="absolute inset-0 rounded-full"
          />
          <Text className="text-white font-bold text-[18px]">Continue</Text>
        </Pressable>
      </View>

      {categoryStepError && (
        <Text className="text-red-500 text-center mt-2">
          {categoryStepError}
        </Text>
      )}
    </View>

  </View>
)}




{/* Profile */}
{step === 3 && (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 90}
  >
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 1 }}
    >
      {/* Top */}
      <View className="ml-[10px] flex-row items-center">
        <Text className="text-4xl text-left">Fill up your Profile</Text>
        <Image
          source={require('../Tools/Logo/fillup.png')}
          className="w-8 h-8 ml-2"
          resizeMode="contain"
        />
      </View>
      <View className="pr-5 ml-[11px]">
        <Text className="text-[20px] text-gray-500 text-left">
          Don&apos;t worry, only you can see your personal data.
        </Text>
      </View>

      {/* Middle */}
      <View className="flex-1 justify-center items-center mt-[20px]">
        {/* Profile Picture Upload */}
        <Text className="text-lg text-bold">Profile Picture</Text>
        <View className="flex-row flex-wrap justify-start gap-4">
        {(profileImagePreview || profileImage) && (
          <View className="relative">
            <Image
              source={{ uri: profileImagePreview || profileImage }}
              className="w-40 h-40 rounded-[10px] border-[1px] border-black"
              resizeMode="cover"
            />
            {/* Delete Button */}
            <Pressable
              onPress={() => {
                setProfileImage('');
                setProfileImagePreview('');
              }}
              className="absolute top-1 right-1 bg-red-500 w-6 h-6 rounded-full items-center justify-center"
            >
              <Text className="text-white font-bold">×</Text>
            </Pressable>
          </View>
        )}

        {/* Upload Button */}
        {!profileImagePreview && !profileImage && (
          <Pressable
            onPress={() => {
              pickAndUploadProfileImage();
              setProfileStepError('');
            }}
            className="w-28 h-28 rounded-[10px] bg-gray-200 items-center justify-center border-2 border-dashed border-gray-400"
            accessibilityLabel="Upload profile picture"
          >
            <Text className="text-sm text-gray-700">
              {uploadingProfile ? 'Uploading...' : 'Upload'}
            </Text>
          </Pressable>
        )}
      </View>




       {/* Form Fields */}
<View className="w-full max-w-[350px] mt-5">

  <TextInput
            ref={firstRef}
            placeholder="First Name"
             placeholderTextColor="#888"
            value={profile.fname}
            onChangeText={t => {
              setProfile({ ...profile, fname: t });
              if (t) setFirstError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${firstError ? 'border-red-500' : 'border-black'}`}
            autoCapitalize="none"
          />

          <TextInput
            ref={lastRef}
            placeholder="Last Name"
             placeholderTextColor="#888"
            value={profile.lname}
            onChangeText={t => {
              setProfile({ ...profile, lname: t });
              if (t) setLastError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${lastError ? 'border-red-500' : 'border-black'}`}
            autoCapitalize="none"
          /> 

  <Pressable
    onPress={() => setDatePickerVisibility(true)}
    className="border p-3 rounded-xl mb-4"
  >
    <Text>{profile.birthday || 'Select Birthday'}</Text>
  </Pressable>

  <DateTimePickerModal
    isVisible={isDatePickerVisible}
    mode="date"
    maximumDate={new Date()}
    onConfirm={date => {
      setDatePickerVisibility(false);
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      setProfile({ ...profile, birthday: formatted });
    }}
    onCancel={() => setDatePickerVisibility(false)}
  />

  <TextInput
  ref={phoneRef}
  placeholder="Phone"
   placeholderTextColor="#888"
  value={profile.phone}
  onChangeText={t => {
    setProfile({ ...profile, phone: t.replace(/[^0-9]/g, '') });
    if (t.length === 11) setPhoneError(false); // remove error when fixed
  }}
  className={`border p-3 rounded-xl mb-4 ${phoneError ? 'border-red-500' : 'border-black'}`}
  keyboardType="number-pad"
  maxLength={11}
  inputMode="numeric"
/>


          <TextInput
            ref={addressRef}
            placeholder="Address"
             placeholderTextColor="#888"
            value={profile.address}
            onChangeText={t => {
              setProfile({ ...profile, address: t });
              if (t) setAddressError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${addressError ? 'border-red-500' : 'border-black'}`}
          />

          <TextInput
            ref={gradeRef}
            placeholder="Grade/Year level"
             placeholderTextColor="#888"
            value={grade}
            onChangeText={t => {
              setGrade(t);
              if (t) setGradeError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${gradeError ? 'border-red-500' : 'border-black'}`}
          />

          <TextInput
            ref={schoolRef}
            placeholder="School"
            placeholderTextColor="#888"
            value={school}
            onChangeText={t => {
              setSchool(t);
              if (t) setSchoolError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${schoolError ? 'border-red-500' : 'border-black'}`}
          />

           <TextInput
            ref={emergencynameRef}
            placeholder="Emergency Contact Name"
             placeholderTextColor="#888"
            value={emergencyContactName}
            onChangeText={t => {
              setEmergencyContactName(t);
              if (t) setEmergencyNameError(false);
            }}
            className={`border p-3 rounded-xl mb-4 ${emergencyNameError ? 'border-red-500' : 'border-black'}`}
          />

  <TextInput
  ref={emergencyRef}
  placeholder="Emergency Contact Phone"
  placeholderTextColor="#888"
  value={emergencyContactPhone}
  onChangeText={t => {
    setEmergencyContactPhone(t.replace(/[^0-9]/g, ''));
    if (t.length === 11) setEmergencyPhoneError(false); // remove error when fixed
  }}
  className={`border p-3 rounded-xl mb-4 ${emergencyPhoneError ? 'border-red-500' : 'border-black'}`}
  keyboardType="number-pad"
  maxLength={11}
  inputMode="numeric"
/>


</View>

{/* Valid ID Upload */}
<View style={{ alignItems: "center", marginTop: 10 }}>
  <Text className="text-lg">Valid ID (Front & Back)</Text>

  {/* Display uploaded pictures with tap-to-capture */}
  <View
    style={{
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 20,
      marginTop: 5,
    }}
  >
    {[0, 1].map((index) => (
      <TouchableOpacity
        key={index}
        activeOpacity={0.8}
        onPress={() => setShowCamera(index)} // ✅ open camera for specific slot
        style={{ alignItems: "center", position: "relative", marginVertical: 5 }}
      >
        {/* Image Frame */}
        <View
          style={{
            width: 250,
            aspectRatio: 85.6 / 53.98, // ✅ true ID card ratio
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: "#f5f5f5",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {validPictures[index] ? (
            <>
              <Image
                source={{ uri: validPictures[index] }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />

              {/* ❌ Remove button */}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // ✅ Prevent triggering camera
                  setValidPictures((prev) =>
                    prev.filter((_, i) => i !== index)
                  );
                }}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: "#888" }}>📷 Tap to capture</Text>
          )}
        </View>

        {/* ✅ Always show label below */}
        <Text
          style={{
            marginTop: 6,
            fontWeight: "500",
            color: "#555",
            textAlign: "center",
          }}
        >
          {index === 0 ? "(Front ID)" : "(Back ID)"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Camera Component */}
  <IDCamera
    visible={showCamera !== false}
    onClose={() => setShowCamera(false)}
    onCaptured={async (uri, base64) => {
      try {
        const data = new FormData();
        data.append("file", `data:image/jpeg;base64,${base64}`);
        data.append("upload_preset", "unsigned_preset");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dckhxhaws/image/upload",
          {
            method: "POST",
            body: data,
          }
        );

        const file = await res.json();
        if (file.secure_url && showCamera !== false) {
          setValidPictures((prev) => {
            const updated = [...prev];
            updated[showCamera] = file.secure_url; // ✅ save to specific slot
            return updated;
          });
        } else {
          alert("Failed to upload ID image");
        }
      } catch (err) {
        console.error("ID Upload Error:", err);
      } finally {
        setShowCamera(false);
      }
    }}
  />
</View>




      </View>

   {/* Bottom */}
      <View className="w-full max-w-[360px] mx-auto mb-10">
        <View className="w-full h-[1px] bg-gray-300 my-4" />

        {/* Continue Button */}
        <Pressable
          className="w-full h-16 rounded-full items-center justify-center shadow-xl overflow-hidden"
          style={{ elevation: 8 }}
          onPress={() => {
            // Reset errors
            setFirstError(false);
            setLastError(false);
            setPhoneError(false);
            setAddressError(false);
            setGradeError(false);
            setSchoolError(false);
            setEmergencyNameError(false);
            setEmergencyPhoneError(false);
            setProfileStepError("");

            if (!profileImage && !profileImagePreview) {
              setProfileStepError("Profile Picture is required."); return;
            }
            if (!profile.fname) {
              setFirstError(true); setProfileStepError("First Name is required."); firstRef.current?.focus(); return;
            }
            if (!profile.lname) {
              setLastError(true); setProfileStepError("Last Name is required."); lastRef.current?.focus(); return;
            }
            if (!profile.birthday) {
              setProfileStepError("Birthday is required."); return;
            }
            if (profile.phone.length !== 11) {
              setPhoneError(true); setProfileStepError("Phone must be 11 digits."); phoneRef.current?.focus(); return;
            }
            if (!profile.address) {
              setAddressError(true); setProfileStepError("Address is required."); addressRef.current?.focus(); return;
            }
            if (!grade) {
              setGradeError(true); setProfileStepError("Grade is required."); gradeRef.current?.focus(); return;
            }
            if (!school) {
              setSchoolError(true); setProfileStepError("School is required."); schoolRef.current?.focus(); return;
            }
            if (!emergencyContactName) {
              setEmergencyNameError(true); setProfileStepError("Emergency contact name required."); emergencynameRef.current?.focus(); return;
            }
            if (emergencyContactPhone.length !== 11) {
              setEmergencyPhoneError(true); setProfileStepError("Emergency phone must be 11 digits."); emergencyRef.current?.focus(); return;
            }
            if (validPictures.length < 2) {
              setProfileStepError("Valid IDs are required."); return;
            }
            // All good
            setProfileStepError("");
            setStep(4);
          }}
        

          >
          <LinearGradient
            colors={['#43435E', '#55556a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute left-0 right-0 top-0 bottom-0 rounded-full"
          />
          <Text className="text-[18px] text-[#ffffff] font-bold z-10">Continue</Text>
        </Pressable>

        {/* Error Message */}
        {profileStepError && (
          <Text className="text-red-500 text-center mt-2">{profileStepError}</Text>
        )}

        {/* Sign In Link */}
        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-gray-500 text-lg mr-2">Already have an account?</Text>
          <Link href="./signin" asChild>
            <Text className="text-red-500 text-lg">Sign In</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
)}


{/* Account */}
{step === 4 && (
  <View className="flex-1 w-full justify-between">
    
    {/* Top */}
    <View>
      <View className="ml-[10px] flex-row items-center">
        <Text className="text-4xl text-left">Create an Account</Text>
        <Image
          source={require('../Tools/Logo/padlock.png')}
          className="w-6 h-6 ml-2"
          resizeMode="contain"
        />
      </View>
      <View className="ml-[11px]">
        <Text className="text-[20px] text-gray-500 text-left">
          Fill the blank to create your account.
        </Text>
      </View>
    </View>

    {/* Middle */}
    <View className="flex-1 justify-center items-center">
      <View className="w-full max-w-[360px]">

        {/* Email */}
        <Text className="mb-[-5] text-lg">Email</Text>
        <TextInput
          className="text-lg px-2 pb-2 border-b-2 border-black-500 mb-6"
          placeholder="Create your email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={account.email}
          onChangeText={t => setAccount({ ...account, email: t })}
        />

        {/* Password */}
        <Text className="mb-[-5] text-lg">Password</Text>
        <View className="flex-row items-center border-b-2 border-black-500">
          <TextInput
            className="flex-1 text-lg px-2 pb-2 bg-transparent"
            placeholder="Create your password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={account.password}
            onChangeText={t => {
              setAccount({ ...account, password: t });
              setPasswordStrength(checkPasswordStrength(t));
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={1}
            className="p-1"
          >
            <Image
              source={
                showPassword
                  ? require('../Tools/Logo/view.png')
                  : require('../Tools/Logo/hide.png')
              }
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Password strength feedback */}
        {account.password && passwordStrength !== 'Strong' && (
          <Text className="mt-2 text-sm text-red-600">
            Password requirement: {passwordStrength}
          </Text>
        )}

        {/* Confirm Password */}
        <Text className="mb-[-5] mt-6 text-lg">Confirm Password</Text>
        <View className="flex-row items-center border-b-2 border-black-500">
          <TextInput
            className="flex-1 text-lg px-2 pb-2 bg-transparent"
            placeholder="Confirm your password"
            placeholderTextColor="#888"
            secureTextEntry={!confirmshowPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setConfirmShowPassword(!confirmshowPassword)}
            activeOpacity={1}
            className="p-1"
          >
            <Image
              source={
                confirmshowPassword
                  ? require('../Tools/Logo/view.png')
                  : require('../Tools/Logo/hide.png')
              }
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm password mismatch feedback */}
        {confirmPassword && account.password !== confirmPassword && (
          <Text className="mt-2 text-sm text-red-600">Passwords do not match</Text>
        )}

        {/* Remember Me
        <View className="flex-row items-center justify-between mt-6 mb-10">
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            className="flex-row items-center"
          >
            <View
              className={`w-5 h-5 rounded border mr-2 ${
                rememberMe
                  ? 'bg-[#43435E] border-[#43435E]'
                  : 'bg-white border-gray-400'
              }`}
            />
            <Text className="text-gray-700 text-lg">Remember me</Text>
          </Pressable>
        </View> */}

        {/* Divider
        <View className="flex-row items-scenter my-4">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-400 text-base">or continue with</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View> */}

        {/* Google Button
        <Pressable
          className="flex-row items-center justify-center w-full max-w-[360px] h-16 rounded-full border border-gray-300 bg-white mb-4 mx-auto"
          style={{ elevation: 2 }}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Image
            source={require('../Tools/Logo/google.png')}
            className="w-6 h-6 mr-3"
            resizeMode="contain"
          />
          <Text className="text-base text-gray-700 font-semibold">
            Continue with Google
          </Text>
        </Pressable> */}
      </View>
    </View>

    {/* Bottom */}
    <View className="w-full max-w-[360px] mx-auto mb-10">
      <View className="w-full h-[1px] bg-gray-300 my-4" />

      {/* Create Account Button */}
      <Pressable
        className="w-full h-16 rounded-full items-center justify-center shadow-xl overflow-hidden"
        style={{ elevation: 8 }}
        onPress={handleRegister}
        disabled={loading}
      >
        <LinearGradient
          colors={["#43435E", "#55556a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute left-0 right-0 top-0 bottom-0 rounded-full"
        />
        <Text className="text-[18px] text-[#ffffff] font-bold z-10">
          {loading ? 'Creating...' : 'Create Account'}
        </Text>
      </Pressable>

      {error && (
        <Text className="text-red-500 text-center mt-2">{error}</Text>
      )}

      <View className="flex-row items-center justify-center mt-4">
        <Text className="text-gray-500 text-lg mr-2">Already have an account?</Text>
        <Link href="./signin" asChild>
          <Text className="text-red-500 text-lg">Sign In</Text>
        </Link>
      </View>
    </View>
  </View>
)}




    </SafeAreaView>
  );

  
};


export default Signup;

