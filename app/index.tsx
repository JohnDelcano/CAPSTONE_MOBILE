import { LinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView className="flex-1">
      <ImageBackground
        source={require("../Tools/Picture/bg.jpg")}
        className="flex-1"
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(67, 67, 94, 0.01)",
            "rgba(67, 67, 94, 0.10)",
            "rgba(67, 67, 94, 0.50)",
            "rgba(67, 67, 94, 0.68)",
            "rgba(67, 67, 94, 0.88)",
            "rgba(67, 67, 94, 1)"
          ]}
          locations={[0, 0.03, 0.10, 0.15, 0.24, 0.31]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="absolute bottom-0 left-0 right-0 items-center justify-center h-[60%] rounded-2xl"
        >
          <View className="mb-[8px]">
            <Image source={require("../Tools/Logo/logo.png")} className="w-32 h-32" resizeMode="contain" />
          </View>
          <Text className="text-[#ffffff] text-3xl font-bold mb-2">Welcome to LIBROSYNC</Text>
          <Text className="text-[#ffffff] text-[17px] mb-20">Your Gateway to learning</Text>
            <View className="flex-row items-center justify-between w-[47%] pt-[23%] ml-[40%]">
            <Text className="text-[#ffffff] text-2xl">Get Started</Text>
            <Link href="./signin" asChild>
              <Pressable className="overflow-visible">
                <View className="bg-[#ffffff] h-[50px] w-[50px] rounded-full items-center justify-center overflow-visible">
                  <Image
                    source={require("../Tools/Logo/rab.png")}
                    className="w-14 h-14 -ml-12"
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
            </Link>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}