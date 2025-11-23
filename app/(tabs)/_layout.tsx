import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { joinUserRoom } from "../../src/api/socket";
import Header from "../Header";

const tabIcons = {
  home: require("../../Tools/Logo/home.png"),
  reserved: require("../../Tools/Logo/reserve.png"),
  favorite: require("../../Tools/Logo/favorite.png"),
  profile: require("../../Tools/Logo/profile.png"),
  bell: require("../../Tools/Logo/bell.png"),
};

export default function TabsLayout() {
  useEffect(() => {
    joinUserRoom(); // auto join on mount
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 120,
          paddingTop: 8,
          paddingRight: 6,
          paddingLeft: 6,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          header: () => <Header />,
          tabBarIcon: ({ focused }) =>
            focused ? (
              <View className="bg-[#4d50ad80] rounded-full w-20 h-10 items-center justify-center">
                <Image source={tabIcons.home} className="w-5 h-5 mb-0.5" style={{ tintColor: "black" }} />
              </View>
            ) : (
              <Image source={tabIcons.home} className="w-5 h-5 mb-0.5" style={{ tintColor: "gray" }} />
            ),
          tabBarLabel: ({ focused }) => (
            <Text className="text-[15px] mt-1" style={{ color: focused ? "black" : "gray" }}>
              Home
            </Text>
          ),
        }}
      />

      {/* Reserved */}
      <Tabs.Screen
        name="reserved"
        options={{
          header: () => <Header />,
          tabBarIcon: ({ focused }) =>
            focused ? (
              <View className="bg-[#4d50ad80] rounded-full w-20 h-10 items-center justify-center">
                <Image source={tabIcons.reserved} className="w-5 h-5 mb-0.5" style={{ tintColor: "black" }} />
              </View>
            ) : (
              <Image source={tabIcons.reserved} className="w-5 h-5 mb-0.5" style={{ tintColor: "gray" }} />
            ),
          tabBarLabel: ({ focused }) => (
            <Text className="text-[15px] mt-1" style={{ color: focused ? "black" : "gray" }}>
              Borrowed
            </Text>
          ),
        }}
      />

      {/* Favorite */}
      <Tabs.Screen
        name="favorite"
        options={{
          header: () => <Header />,
          tabBarIcon: ({ focused }) =>
            focused ? (
              <View className="bg-[#4d50ad80] rounded-full w-20 h-10 items-center justify-center">
                <Image source={tabIcons.favorite} className="w-5 h-5 mb-0.5" style={{ tintColor: "black" }} />
              </View>
            ) : (
              <Image source={tabIcons.favorite} className="w-5 h-5 mb-0.5" style={{ tintColor: "gray" }} />
            ),
          tabBarLabel: ({ focused }) => (
            <Text className="text-[15px] mt-1" style={{ color: focused ? "black" : "gray" }}>
              Favorites
            </Text>
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) =>
            focused ? (
              <View className="bg-[#4d50ad80] rounded-full w-20 h-10 items-center justify-center">
                <Image source={tabIcons.profile} className="w-5 h-5 mb-0.5" style={{ tintColor: "black" }} />
              </View>
            ) : (
              <Image source={tabIcons.profile} className="w-5 h-5 mb-0.5" style={{ tintColor: "gray" }} />
            ),
          tabBarLabel: ({ focused }) => (
            <Text className="text-[15px] mt-1" style={{ color: focused ? "black" : "gray" }}>
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
