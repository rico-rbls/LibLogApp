import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 py-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          Good afternoon!
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground">
          Welcome to LibLog
        </Text>
      </View>
    </SafeAreaView>
  );
}
