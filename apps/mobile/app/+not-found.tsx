import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-2xl font-bold text-foreground">
            Page Not Found
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            The screen you're looking for doesn't exist.
          </Text>
          <Link href="/" className="mt-6">
            <Text className="text-base font-semibold text-primary">
              Go to Home
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
