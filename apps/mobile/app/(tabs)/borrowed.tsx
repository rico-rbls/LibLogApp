import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BorrowedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 py-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          My Loans
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground">
          Track your borrowed books and due dates
        </Text>
      </View>
    </SafeAreaView>
  );
}
